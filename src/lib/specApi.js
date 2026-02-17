const cache = new Map();

export async function fetchSpec(mnemonic) {
  if (cache.has(mnemonic)) return cache.get(mnemonic);

  const res = await fetch(`/docs/autogen?target=${encodeURIComponent(mnemonic)}`);
  if (!res.ok) throw new Error(`Failed to fetch spec for "${mnemonic}": ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`No spec found for "${mnemonic}"`);

  const spec = data[0];
  cache.set(mnemonic, spec);
  return spec;
}

const KNOWN_PRIMITIVES = ['String', 'Boolean', 'Integer', 'Long', 'Double', 'Float', 'Object'];
const NESTED_MNEMONICS = ['DomainFunction', 'DomainTask'];

export function isNestedParam(param) {
  return param.injectionPoint && NESTED_MNEMONICS.includes(param.mnemonic);
}

export function isPrimitive(mnemonic) {
  return KNOWN_PRIMITIVES.includes(mnemonic);
}

/**
 * True for non-nested params that accept injection (ResourceInjector).
 * These get the inject toggle in the UI.
 */
export function isInjectionPoint(param) {
  return param.injectionPoint === true && !isNestedParam(param);
}

/**
 * Check if a value stored in node.values is an injector reference.
 */
export function isInjectorRef(value) {
  return value != null && typeof value === 'object' && '__injectorNodeId' in value;
}

/**
 * Recursively collect all CONCRETE ResourceInjector mnemonics.
 * Cached after first call.
 */
let _concreteInjectors = null;

export async function fetchConcreteInjectors() {
  if (_concreteInjectors) return _concreteInjectors;

  const result = [];
  async function collect(mnemonic) {
    const spec = await fetchSpec(mnemonic);
    if (spec.category === 'CONCRETE') {
      result.push(mnemonic);
    } else if (spec.implementations?.length) {
      await Promise.all(spec.implementations.map(collect));
    }
  }
  await collect('ResourceInjector');
  _concreteInjectors = result.sort();
  return _concreteInjectors;
}

/**
 * Unregister an injector node (and its nested injectors) from the registry.
 * Walks the injector's values looking for nested __injectorNodeId refs.
 */
export function unregisterInjectorDeep(nodeId) {
  const node = getNode(nodeId);
  if (!node) return;
  // Recurse into values that may be nested injectors
  for (const val of Object.values(node.values)) {
    if (isInjectorRef(val)) {
      unregisterInjectorDeep(val.__injectorNodeId);
    }
    // MAP entries: array of {key, value} where value may be injector
    if (Array.isArray(val)) {
      for (const item of val) {
        if (isInjectorRef(item)) {
          unregisterInjectorDeep(item.__injectorNodeId);
        }
        if (item && typeof item === 'object' && isInjectorRef(item.value)) {
          unregisterInjectorDeep(item.value.__injectorNodeId);
        }
      }
    }
  }
  // Also recurse into children (for injectors that have nested children like Inject.If)
  for (const kids of Object.values(node.children)) {
    for (const kid of kids) {
      unregisterDeep(kid);
    }
  }
  unregisterNode(nodeId);
}

// Flat registry of all nodes by id
const nodeRegistry = new Map();

export function registerNode(node) {
  nodeRegistry.set(node.id, node);
}

export function unregisterNode(id) {
  nodeRegistry.delete(id);
}

export function getNode(id) {
  return nodeRegistry.get(id) ?? null;
}

export function createNode(mnemonic, spec) {
  const node = {
    id: crypto.randomUUID(),
    mnemonic,
    spec,
    values: {},
    children: {},
  };
  registerNode(node);
  return node;
}

/**
 * Add a child node under a parent's param slot.
 * Operates on registry objects (plain JS, no proxy).
 */
export function addChild(parentId, paramName, childNode) {
  const parent = getNode(parentId);
  if (!parent) return;
  const param = parent.spec.parameters[paramName];
  if (!parent.children[paramName]) {
    parent.children[paramName] = [];
  }
  if (param?.injectionStrategy === 'DIRECT') {
    // Replace existing child
    const existing = parent.children[paramName][0];
    if (existing) unregisterDeep(existing);
    parent.children[paramName] = [childNode];
  } else {
    parent.children[paramName] = [...parent.children[paramName], childNode];
  }
}

/**
 * Remove a child node at a given index from a parent's param slot.
 */
export function removeChild(parentId, paramName, index) {
  const parent = getNode(parentId);
  if (!parent) return;
  const removed = parent.children[paramName]?.[index];
  if (removed) unregisterDeep(removed);
  parent.children[paramName] = (parent.children[paramName] || []).filter((_, i) => i !== index);
}

export function clearAllNodes() {
  nodeRegistry.clear();
}

function unregisterDeep(node) {
  unregisterNode(node.id);
  for (const kids of Object.values(node.children)) {
    for (const kid of kids) {
      unregisterDeep(kid);
    }
  }
}
