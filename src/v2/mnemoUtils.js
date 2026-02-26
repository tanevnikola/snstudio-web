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


export function getSpec(mnemonic) {
  return cache.get(mnemonic) ?? null;
}

export function isImplementing(mnemonic, implementsMnemonic) {
  // if (implementsMnemonic == 'Object') {
  //   return true;
  // }
  const spec = getSpec(mnemonic);
  if (!spec) return false;
  if (spec.implementsStereotype === implementsMnemonic) return true;
  if (spec.implementsStereotype) {
    return isImplementing(spec.implementsStereotype, implementsMnemonic);
  }
  return false;
}

export function isInjectionCollection(mnemonic) {
  const spec = getSpec(mnemonic);
  if (!spec?.parameters) return false;
  const params = Object.entries(spec.parameters);
  return params.length === 1
    && params[0][0] === '@delegating@'
    && params[0][1].injectionStrategy === 'COLLECTION';
}

const STRING_MNEMONICS = new Set(['String']);
const BOOLEAN_MNEMONICS = new Set(['Boolean', 'boolean']);
const NUMBER_MNEMONICS = new Set(['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short']);

export function isStringPrimitive(mnemonic) {
  return STRING_MNEMONICS.has(mnemonic);
}

export function isBooleanPrimitive(mnemonic) {
  return BOOLEAN_MNEMONICS.has(mnemonic);
}

export function isNumberPrimitive(mnemonic) {
  return NUMBER_MNEMONICS.has(mnemonic);
}

export function isEnumPrimitive(mnemonic) {
  return getSpec(mnemonic)?.category === 'ENUM';
}

export function isPrimitive(mnemonic) {
  return isStringPrimitive(mnemonic)
    || isBooleanPrimitive(mnemonic)
    || isNumberPrimitive(mnemonic)
    || isEnumPrimitive(mnemonic);
}

export function isResourceInjector(mnemonic) {
  return isImplementing(mnemonic,  "ResourceInjector")
}


export function getPrimitiveMnemonics() {
  const result = [];
  for (const mnemonic of cache.keys()) {
    if (isPrimitive(mnemonic)) result.push(mnemonic);
  }
  return result.sort();
}

export function getImplementations(mnemonic) {
  const result = new Set();
  function collect(mn) {
    const spec = getSpec(mn);
    if (!spec) return;
    if (spec.category !== 'ABSTRACT') {
      result.add(mn);
    }
    if (spec.implementations?.length) {
      for (const impl of spec.implementations) {
        collect(impl);
      }
    }
  }
  const rootSpec = getSpec(mnemonic);
  if (rootSpec?.implementations?.length) {
    for (const impl of rootSpec.implementations) {
      collect(impl);
    }
  }
  return [...result].sort();
}

export function getNonDomainFunctionParameters(mnemonicSpec) {
  if (!mnemonicSpec?.parameters) return [];
  return Object.entries(mnemonicSpec.parameters)
    .filter(([, p]) => p.mnemonic !== 'DomainFunction')
    .filter(([, p]) => !p.hidden)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    .map(([name, p]) => ({ name, ...p }));
}