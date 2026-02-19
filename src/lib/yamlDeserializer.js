import yaml from 'js-yaml';
import { fetchSpec, createNode, isNestedParam, isMnemonicType, clearAllNodes } from './specApi.js';

/**
 * Parse t:/v: YAML text and rebuild the node tree in the registry.
 * Returns the root node's id, or null if empty/invalid.
 */
export async function yamlToNodeTree(yamlText) {
  if (!yamlText.trim()) return null;

  const obj = yaml.load(yamlText);
  if (!obj || typeof obj !== 'object') return null;

  // Clear old tree before rebuilding
  clearAllNodes();

  // Root is a DomainFunction — supports both explicit t:/v: and legacy inlined format
  const root = await objectToNode(obj, 'DomainFunction');
  return root.id;
}

/**
 * Check if a parsed YAML value looks like a typed object { t: ..., v: ... }.
 */
function looksLikeTypedObject(val) {
  return val != null && typeof val === 'object' && !Array.isArray(val) && typeof val.t === 'string';
}

/**
 * Create an injector node from a { t: ..., v: ... } YAML object.
 * Returns { __injectorNodeId: id } reference for storage in parent values.
 */
async function parseInjectorValue(val) {
  const injNode = await objectToNode(val, null);
  return { __injectorNodeId: injNode.id };
}

/**
 * Recursively convert a plain object into a registered node.
 *
 * @param {object} obj - the parsed YAML object
 * @param {string|null} expectedMnemonic - if set, this object may be inlined
 *   (no t:/v: wrapper) because the parent param's mnemonic is concrete and matches.
 */
async function objectToNode(obj, expectedMnemonic) {
  // Determine if this is a wrapped { t, v } object or an inlined properties object
  let mnemonic;
  let properties;
  let isFactory = false;

  if (obj.t && typeof obj.t === 'string') {
    // Wrapped: { t: 'Task.REST', v: { ... } } or { t: ..., factory: { ... } }
    mnemonic = obj.t;
    isFactory = obj.factory !== undefined;
    properties = isFactory ? obj.factory : obj.v;
  } else if (expectedMnemonic) {
    // Inlined: properties directly (type is known from parent param)
    mnemonic = expectedMnemonic;
    properties = obj;
  } else {
    throw new Error('Cannot determine node type: no t: field and no expected mnemonic');
  }

  const spec = await fetchSpec(mnemonic);
  const node = createNode(mnemonic, spec);
  if (isFactory) node.factory = true;

  if (properties === undefined || properties === null) return node;

  const delegating = spec.parameters['@delegating@'];

  if (delegating) {
    // @delegating@ — properties go directly into children or values
    if (isNestedParam(delegating)) {
      if (delegating.injectionStrategy === 'COLLECTION' && Array.isArray(properties)) {
        node.children['@delegating@'] = await Promise.all(
          properties.map((item) => objectToNode(item, delegating.mnemonic))
        );
      } else if (typeof properties === 'object') {
        node.children['@delegating@'] = [await objectToNode(properties, delegating.mnemonic)];
      }
    } else {
      // Non-nested delegating: value may be a literal or an injector
      if (looksLikeTypedObject(properties)) {
        node.values['@delegating@'] = await parseInjectorValue(properties);
      } else {
        node.values['@delegating@'] = properties;
      }
    }
    return node;
  }

  // properties is an object with named params
  if (typeof properties !== 'object' || Array.isArray(properties)) return node;

  for (const [name, val] of Object.entries(properties)) {
    const param = spec.parameters[name];
    if (!param) continue;

    if (isNestedParam(param)) {
      // Nested children (DomainFunction/DomainTask)
      if (param.injectionStrategy === 'COLLECTION' && Array.isArray(val)) {
        node.children[name] = await Promise.all(
          val.map((item) => objectToNode(item, param.mnemonic))
        );
      } else if (typeof val === 'object' && val !== null) {
        node.children[name] = [await objectToNode(val, param.mnemonic)];
      }
    } else if (isMnemonicType(param)) {
      // Mnemonic-type param — create real child nodes
      if (param.injectionStrategy === 'MAP' && typeof val === 'object' && !Array.isArray(val)) {
        const kids = [];
        for (const [k, v] of Object.entries(val)) {
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            const child = await objectToNode(v, param.mnemonic);
            child.mapKey = k;
            kids.push(child);
          }
        }
        node.children[name] = kids;
      } else if (param.injectionStrategy === 'COLLECTION' && Array.isArray(val)) {
        node.children[name] = await Promise.all(
          val.map((item) => objectToNode(item, param.mnemonic))
        );
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        node.children[name] = [await objectToNode(val, param.mnemonic)];
      }
    } else if (param.injectionStrategy === 'MAP' && typeof val === 'object' && !Array.isArray(val)) {
      // MAP of primitives/injectors
      const entries = [];
      for (const [k, v] of Object.entries(val)) {
        if (looksLikeTypedObject(v)) {
          entries.push({ key: k, value: await parseInjectorValue(v) });
        } else {
          entries.push({ key: k, value: v });
        }
      }
      node.values[name] = entries;
    } else if (param.injectionStrategy === 'COLLECTION' && Array.isArray(val)) {
      // COLLECTION items may be literals or injectors
      node.values[name] = await Promise.all(
        val.map(async (item) => {
          if (looksLikeTypedObject(item)) {
            return await parseInjectorValue(item);
          }
          return item;
        })
      );
    } else if (looksLikeTypedObject(val)) {
      // DIRECT param with an injector value
      node.values[name] = await parseInjectorValue(val);
    } else {
      node.values[name] = val;
    }
  }

  return node;
}
