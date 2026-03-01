export function isDelegating(parameterSpec) {
  return parameterSpec?.name === '@delegating@';
}

export function isMapInjection(parameterSpec) {
  return parameterSpec?.injectionStrategy === 'MAP';
}

export function isCollectionInjection(parameterSpec) {
  return parameterSpec?.injectionStrategy === 'COLLECTION';
}

export function isDirectInjection(parameterSpec) {
  return parameterSpec?.injectionStrategy === 'DIRECT';
}

export function isInjectionPoint(parameterSpec) {
  return parameterSpec?.injectionPoint && isDirectInjection(parameterSpec);
}

export function isInjectionEager(parameterSpec) {
  return parameterSpec?.eager === true;
}

export function isInjectionAllowed(parameterSpec, isFactory, isWithinFactory) {
  return isInjectionPoint(parameterSpec) && (!isInjectionEager(parameterSpec || isFactory || isWithinFactory));
}

export function deriveMapItemSpec(parameterSpec) {
  return {...parameterSpec, name: '@delegating@', injectionStrategy: 'DIRECT', defaultValue: null}
}

export function deriveCollectionItemSpec(parameterSpec) {
  return {...parameterSpec, name: '@delegating@', injectionStrategy: 'DIRECT', defaultValue: null}
}

