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
const INJECT_ONLY_RE = /\[\]$/; // byte[], int[], boolean[] etc.
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
 * True for injection-point params whose mnemonic is an array type (byte[], int[], etc.)
 * These can only be meaningfully set via injection — no literal input.
 */
export function isInjectOnly(param) {
  return isInjectionPoint(param) && INJECT_ONLY_RE.test(param.mnemonic);
}

/**
 * Check if a value stored in node.values is an injector reference.
 */
export function isInjectorRef(value) {
  return value != null && typeof value === 'object' && '__injectorNodeId' in value;
}

/**
 * Check if a value stored in node.values is a mnemonic-type reference.
 */
export function isMnemonicRef(value) {
  return value != null && typeof value === 'object' && '__mnemonicType' in value;
}

/**
 * Check if a mnemonic ref has the factory flag set.
 */
export function isMnemonicFactory(value) {
  return isMnemonicRef(value) && value.__mnemonicFactory === true;
}

/**
 * Get a spec from cache synchronously (returns null if not cached).
 * Use after loading screen has warmed the cache.
 */
export function getSpecSync(mnemonic) {
  return cache.get(mnemonic) ?? null;
}

/**
 * Check if a param represents a complex mnemonic type (not primitive, not enum,
 * not a nested child slot). These get a dropdown + property editor.
 * Note: injection points with mnemonic types (e.g. Embedding) are included —
 * they get MnemonicField which handles injection on inner params.
 */
export function isMnemonicType(param) {
  if (isNestedParam(param)) return false;
  if (isPrimitive(param.mnemonic)) return false;
  const spec = getSpecSync(param.mnemonic);
  if (!spec) return false;
  if (spec.category === 'ENUM') return false;
  return true;
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

/**
 * Detach a node from its current parent WITHOUT unregistering it.
 * Used for move operations (drag-drop reorder).
 * Returns { parentId, paramName, index } if found, or null.
 */
export function detachNode(nodeId) {
  for (const [pid, parent] of nodeRegistry) {
    for (const [paramName, kids] of Object.entries(parent.children)) {
      const index = kids.findIndex((k) => k.id === nodeId);
      if (index !== -1) {
        parent.children[paramName] = kids.filter((_, i) => i !== index);
        return { parentId: pid, paramName, index };
      }
    }
  }
  return null;
}

/**
 * Swap a child at `index` with the one at `index + delta` within a parent's param slot.
 * delta = -1 for move up, +1 for move down.
 */
export function moveChild(parentId, paramName, index, delta) {
  const parent = getNode(parentId);
  if (!parent) return;
  const kids = parent.children[paramName];
  if (!kids) return;
  const target = index + delta;
  if (target < 0 || target >= kids.length) return;
  const tmp = kids[index];
  kids[index] = kids[target];
  kids[target] = tmp;
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
