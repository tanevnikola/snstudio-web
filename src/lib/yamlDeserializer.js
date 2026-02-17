import yaml from 'js-yaml';
import { fetchSpec, createNode, isNestedParam, clearAllNodes } from './specApi.js';

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

  // Root is always an inlined DomainFunction (no t:/v: wrapper)
  const root = await objectToNode(obj, 'DomainFunction');
  return root.id;
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

  if (obj.t && typeof obj.t === 'string') {
    // Wrapped: { t: 'Task.REST', v: { ... } }
    mnemonic = obj.t;
    properties = obj.v;
  } else if (expectedMnemonic) {
    // Inlined: properties directly (type is known from parent param)
    mnemonic = expectedMnemonic;
    properties = obj;
  } else {
    throw new Error('Cannot determine node type: no t: field and no expected mnemonic');
  }

  const spec = await fetchSpec(mnemonic);
  const node = createNode(mnemonic, spec);

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
      node.values['@delegating@'] = properties;
    }
    return node;
  }

  // properties is an object with named params
  if (typeof properties !== 'object' || Array.isArray(properties)) return node;

  for (const [name, val] of Object.entries(properties)) {
    const param = spec.parameters[name];
    if (!param) continue;

    if (isNestedParam(param)) {
      // Nested children
      if (param.injectionStrategy === 'COLLECTION' && Array.isArray(val)) {
        node.children[name] = await Promise.all(
          val.map((item) => objectToNode(item, param.mnemonic))
        );
      } else if (typeof val === 'object' && val !== null) {
        node.children[name] = [await objectToNode(val, param.mnemonic)];
      }
    } else if (param.injectionStrategy === 'MAP' && typeof val === 'object' && !Array.isArray(val)) {
      // MAP — convert { key: value } back to [{ key, value }]
      node.values[name] = Object.entries(val).map(([k, v]) => ({ key: k, value: v }));
    } else if (param.injectionStrategy === 'COLLECTION' && Array.isArray(val)) {
      node.values[name] = val;
    } else {
      node.values[name] = val;
    }
  }

  return node;
}
