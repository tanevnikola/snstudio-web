const cache = new Map();

export async function fetchSpec(mnemonic) {
  if (cache.has(mnemonic)) return cache.get(mnemonic);

  const res = await fetch(`/docs/autogen?target=${encodeURIComponent(mnemonic)}`);
  if (!res.ok) throw new Error(`Failed to fetch spec for "${mnemonic}": ${res.status}`);
  const data = await res.json();
  if (!data?.length) throw new Error(`No spec found for "${mnemonic}"`);

  for (const spec of data) {
    if (spec.mnemonic && !cache.has(spec.mnemonic)) {
      cache.set(spec.mnemonic, spec);
    }
  }

  const spec = cache.get(mnemonic) ?? data[0];
  if (!cache.has(mnemonic)) cache.set(mnemonic, spec);
  return spec;
}

export function getSpecSync(mnemonic) {
  return cache.get(mnemonic) ?? null;
}

export function isImplementingSync(mnemonic, implementsMnemonic) {
  const spec = getSpecSync(mnemonic);
  if (!spec) return false;
  if (spec.implementsStereotype === implementsMnemonic) return true;
  if (spec.implementsStereotype) {
    return isImplementingSync(spec.implementsStereotype, implementsMnemonic);
  }
  return false;
}

export async function loadAllSpecs(roots = [
  'Speck', 'Object',
  'int', 'long', 'double', 'float', 'boolean', 'byte',
  'int[]', 'long[]', 'double[]', 'float[]', 'boolean[]', 'byte[]',
], onProgress) {
  const seedList = Array.isArray(roots) ? roots : [roots];
  const visited = new Set();
  const queue = [...seedList];
  let loaded = 0;
  let total = seedList.length;

  while (queue.length > 0) {
    const m = queue.shift();
    if (visited.has(m)) continue;
    visited.add(m);

    try {
      const spec = await fetchSpec(m);
      if (spec.implementations?.length) {
        for (const impl of spec.implementations) {
          if (!visited.has(impl)) {
            queue.push(impl);
            total++;
          }
        }
      }
    } catch { /* skip failed */ }

    loaded++;
    onProgress?.(loaded, total);
    await new Promise(r => setTimeout(r, 1));
  }

  return loaded;
}

export function isInjectionCollection(mnemonic) {
  const spec = getSpecSync(mnemonic);
  if (!spec?.parameters) return false;
  const params = Object.entries(spec.parameters);
  return params.length === 1
    && params[0][0] === '@delegating@'
    && params[0][1].injectionStrategy === 'COLLECTION';
}

export function getConcreteImplementations(mnemonic) {
  const result = [];
  function collect(mn) {
    const spec = getSpecSync(mn);
    if (!spec) return;
    if (spec.category !== 'ABSTRACT') {
      result.push(mn);
    }
    if (spec.implementations?.length) {
      for (const impl of spec.implementations) {
        collect(impl);
      }
    }
  }
  const rootSpec = getSpecSync(mnemonic);
  if (rootSpec?.implementations?.length) {
    for (const impl of rootSpec.implementations) {
      collect(impl);
    }
  }
  return result.sort();
}
