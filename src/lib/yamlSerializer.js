import yaml from 'js-yaml';
import { isNestedParam, isInjectorRef, isMnemonicRef, getNode } from './specApi.js';

/**
 * Convert a node tree into the t:/v: YAML notation.
 * Uses the registry (plain objects) to avoid Svelte proxy dependencies.
 * @param {string} nodeId - root node ID
 * @returns {{ text: string, lineMap: Map<string, number> }}
 *   text — the YAML string
 *   lineMap — maps nodeId → 0-based line number where that node starts
 */
export function nodeToYaml(nodeId) {
  const node = getNode(nodeId);
  if (!node) return { text: '', lineMap: new Map() };

  const markers = new Map(); // marker string → nodeId
  const obj = nodeToObject(node, node.mnemonic, markers);
  const raw = yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });

  // Build lineMap by scanning for marker keys, then strip them.
  // When a marker is the first key in an array item (has "- " prefix),
  // transfer the "- " to the next real line so array structure is preserved.
  const lineMap = new Map();
  const MARKER_RE = /^(\s*(-\s+)?)__node_(.+):\s*null\s*$/;
  const lines = raw.split('\n');
  const cleanLines = [];
  let cleanLineIndex = 0;
  let pendingArrayPrefix = null; // indent + "- " to prepend to next line

  for (const line of lines) {
    const m = line.match(MARKER_RE);
    if (m) {
      const indent = m[1];
      const dash = m[2]; // "- " or undefined
      const nid = m[3];
      lineMap.set(nid, cleanLineIndex);
      if (dash) {
        // This marker was the first item in an array entry — save the prefix
        pendingArrayPrefix = indent;
      }
    } else {
      let out = line;
      if (pendingArrayPrefix != null) {
        // Replace leading spaces with the array prefix (indent + "- ")
        const stripped = line.replace(/^\s+/, '');
        out = pendingArrayPrefix + stripped;
        pendingArrayPrefix = null;
      }
      cleanLines.push(out);
      cleanLineIndex++;
    }
  }

  return { text: cleanLines.join('\n'), lineMap };
}

/**
 * Convert a node tree to a plain JS object in t:/v: format.
 *
 * @param {object} node - the node from the registry
 * @param {string|null} expectedMnemonic - the mnemonic the parent param expects
 *   If the node's mnemonic matches exactly, we inline (skip t:/v: wrapper).
 *   If it differs (concrete subtype of abstract param), we wrap with t:/v:.
 */
function nodeToObject(node, expectedMnemonic, markers) {
  const params = node.spec.parameters;
  const inline = expectedMnemonic && node.mnemonic === expectedMnemonic;
  const marker = `__node_${node.id}`;
  if (markers) markers.set(marker, node.id);

  // Build the properties object (v contents)
  const v = buildProperties(node, params, markers);

  // @delegating@ means the value goes directly (no param name wrapper)
  const delegating = params['@delegating@'];
  if (delegating) {
    if (isNestedParam(delegating)) {
      const kids = node.children['@delegating@'];
      if (kids && kids.length > 0) {
        const mapped = kids.map((child) => nodeToObject(child, delegating.mnemonic, markers));
        if (delegating.injectionStrategy === 'COLLECTION') {
          return inline ? mapped : { [marker]: null, t: node.mnemonic, v: mapped };
        } else {
          return inline ? mapped[0] : { [marker]: null, t: node.mnemonic, v: mapped[0] };
        }
      }
      return inline ? {} : { [marker]: null, t: node.mnemonic };
    } else {
      const val = node.values['@delegating@'];
      if (val !== undefined && val !== '') {
        if (isInjectorRef(val)) {
          const s = serializeInjectorRef(val, markers);
          if (s != null) return inline ? s : { [marker]: null, t: node.mnemonic, v: s };
        }
        const coerced = coerceValue(val, delegating.mnemonic);
        return inline ? coerced : { [marker]: null, t: node.mnemonic, v: coerced };
      }
      return inline ? undefined : { [marker]: null, t: node.mnemonic };
    }
  }

  if (inline) {
    // Inline: just output the properties directly (no t:/v: wrapper)
    // Inject marker as first key
    if (Object.keys(v).length > 0) {
      return { [marker]: null, ...v };
    }
    return { [marker]: null };
  }

  // Wrapped: { t: mnemonic, v: { ...properties } }
  if (Object.keys(v).length === 0) {
    return { [marker]: null, t: node.mnemonic };
  }
  return { [marker]: null, t: node.mnemonic, v };
}

/**
 * Build the properties object from a node's values and children.
 */
function buildProperties(node, params, markers) {
  const v = {};

  // Add property values (non-nested params)
  for (const [name, param] of Object.entries(params)) {
    if (name === '@delegating@') continue;
    if (isNestedParam(param)) continue;

    const val = node.values[name];
    if (val === undefined || val === '') continue;

    // Check if the entire value is an injector reference
    if (isInjectorRef(val)) {
      const serialized = serializeInjectorRef(val, markers);
      if (serialized != null) v[name] = serialized;
      continue;
    }

    // Check if the value is a mnemonic-type reference
    if (isMnemonicRef(val)) {
      const serialized = serializeMnemonicRef(val);
      if (serialized != null) v[name] = serialized;
      continue;
    }

    if (param.injectionStrategy === 'MAP') {
      if (Array.isArray(val) && val.length > 0) {
        const map = {};
        for (const entry of val) {
          if (entry.key) {
            // Each map value may be an injector ref
            if (isInjectorRef(entry.value)) {
              const s = serializeInjectorRef(entry.value, markers);
              if (s != null) map[entry.key] = s;
            } else {
              map[entry.key] = entry.value;
            }
          }
        }
        if (Object.keys(map).length > 0) {
          v[name] = map;
        }
      }
    } else if (param.injectionStrategy === 'COLLECTION') {
      if (Array.isArray(val) && val.length > 0) {
        v[name] = val
          .filter((x) => x !== '')
          .map((item) => isInjectorRef(item) ? (serializeInjectorRef(item, markers) ?? item) : item);
      }
    } else {
      v[name] = coerceValue(val, param.mnemonic);
    }
  }

  // Add nested children (DomainFunction/DomainTask params)
  for (const [name, param] of Object.entries(params)) {
    if (name === '@delegating@') continue;
    if (!isNestedParam(param)) continue;

    const kids = node.children[name];
    if (!kids || kids.length === 0) continue;

    if (param.injectionStrategy === 'COLLECTION') {
      v[name] = kids.map((child) => nodeToObject(child, param.mnemonic, markers));
    } else {
      v[name] = nodeToObject(kids[0], param.mnemonic, markers);
    }
  }

  return v;
}

/**
 * Serialize an injector reference { __injectorNodeId } to a t:/v: object.
 * Reuses nodeToObject — injectors are normal nodes in the registry.
 */
function serializeInjectorRef(ref, markers) {
  if (!ref?.__injectorNodeId) return null;
  const injNode = getNode(ref.__injectorNodeId);
  if (!injNode) return null;
  return nodeToObject(injNode, null, markers);
}

/**
 * Serialize a mnemonic-type value { __mnemonicType, __mnemonicValues, __mnemonicFactory? }
 * to { t, v } or { t, factory } when factory flag is set.
 */
function serializeMnemonicRef(ref) {
  if (!ref?.__mnemonicType) return null;
  const isFactory = ref.__mnemonicFactory === true;
  const valKey = isFactory ? 'factory' : 'v';
  const vals = ref.__mnemonicValues;
  if (!vals || Object.keys(vals).length === 0) {
    return { t: ref.__mnemonicType };
  }
  // Recursively serialize nested mnemonic/injector refs in the values
  const v = {};
  for (const [k, val] of Object.entries(vals)) {
    if (isMnemonicRef(val)) {
      const s = serializeMnemonicRef(val);
      if (s != null) v[k] = s;
    } else if (isInjectorRef(val)) {
      const s = serializeInjectorRef(val, null);
      if (s != null) v[k] = s;
    } else if (val !== undefined && val !== '') {
      v[k] = val;
    }
  }
  if (Object.keys(v).length === 0) {
    return { t: ref.__mnemonicType };
  }
  return { t: ref.__mnemonicType, [valKey]: v };
}

function coerceValue(val, mnemonic) {
  if (mnemonic === 'Boolean') {
    return val === true || val === 'true';
  }
  if (mnemonic === 'Integer' || mnemonic === 'Long') {
    const n = parseInt(val, 10);
    return isNaN(n) ? val : n;
  }
  if (mnemonic === 'Double' || mnemonic === 'Float') {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  }
  return val;
}
