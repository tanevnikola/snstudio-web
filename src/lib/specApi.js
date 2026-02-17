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
