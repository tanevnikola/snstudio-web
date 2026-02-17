import yaml from 'js-yaml';
import { isNestedParam, isInjectorRef, getNode } from './specApi.js';

/**
 * Convert a node tree into the t:/v: YAML notation.
 * Uses the registry (plain objects) to avoid Svelte proxy dependencies.
 * @param {string} nodeId - root node ID
 */
export function nodeToYaml(nodeId) {
  const node = getNode(nodeId);
  if (!node) return '';
  // Root DomainFunction is always inlined (no t:/v: wrapper)
  const obj = nodeToObject(node, node.mnemonic);
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });
}

/**
 * Convert a node tree to a plain JS object in t:/v: format.
 *
 * @param {object} node - the node from the registry
 * @param {string|null} expectedMnemonic - the mnemonic the parent param expects
 *   If the node's mnemonic matches exactly, we inline (skip t:/v: wrapper).
 *   If it differs (concrete subtype of abstract param), we wrap with t:/v:.
 */
function nodeToObject(node, expectedMnemonic) {
  const params = node.spec.parameters;
  const inline = expectedMnemonic && node.mnemonic === expectedMnemonic;

  // Build the properties object (v contents)
  const v = buildProperties(node, params);

  // @delegating@ means the value goes directly (no param name wrapper)
  const delegating = params['@delegating@'];
  if (delegating) {
    if (isNestedParam(delegating)) {
      const kids = node.children['@delegating@'];
      if (kids && kids.length > 0) {
        const mapped = kids.map((child) => nodeToObject(child, delegating.mnemonic));
        if (delegating.injectionStrategy === 'COLLECTION') {
          return inline ? mapped : { t: node.mnemonic, v: mapped };
        } else {
          return inline ? mapped[0] : { t: node.mnemonic, v: mapped[0] };
        }
      }
      return inline ? {} : { t: node.mnemonic };
    } else {
      const val = node.values['@delegating@'];
      if (val !== undefined && val !== '') {
        if (isInjectorRef(val)) {
          const s = serializeInjectorRef(val);
          if (s != null) return inline ? s : { t: node.mnemonic, v: s };
        }
        const coerced = coerceValue(val, delegating.mnemonic);
        return inline ? coerced : { t: node.mnemonic, v: coerced };
      }
      return inline ? undefined : { t: node.mnemonic };
    }
  }

  if (inline) {
    // Inline: just output the properties directly (no t:/v: wrapper)
    return Object.keys(v).length > 0 ? v : {};
  }

  // Wrapped: { t: mnemonic, v: { ...properties } }
  if (Object.keys(v).length === 0) {
    return { t: node.mnemonic };
  }
  return { t: node.mnemonic, v };
}

/**
 * Build the properties object from a node's values and children.
 */
function buildProperties(node, params) {
  const v = {};

  // Add property values (non-nested params)
  for (const [name, param] of Object.entries(params)) {
    if (name === '@delegating@') continue;
    if (isNestedParam(param)) continue;

    const val = node.values[name];
    if (val === undefined || val === '') continue;

    // Check if the entire value is an injector reference
    if (isInjectorRef(val)) {
      const serialized = serializeInjectorRef(val);
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
              const s = serializeInjectorRef(entry.value);
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
          .map((item) => isInjectorRef(item) ? (serializeInjectorRef(item) ?? item) : item);
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
      v[name] = kids.map((child) => nodeToObject(child, param.mnemonic));
    } else {
      v[name] = nodeToObject(kids[0], param.mnemonic);
    }
  }

  return v;
}

/**
 * Serialize an injector reference { __injectorNodeId } to a t:/v: object.
 * Reuses nodeToObject — injectors are normal nodes in the registry.
 */
function serializeInjectorRef(ref) {
  if (!ref?.__injectorNodeId) return null;
  const injNode = getNode(ref.__injectorNodeId);
  if (!injNode) return null;
  // Injectors are always wrapped (never inlined) — pass null as expectedMnemonic
  return nodeToObject(injNode, null);
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
