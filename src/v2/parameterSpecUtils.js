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

export function isInjectionAllowed(parameterSpec) {
  return isInjectionPoint(parameterSpec) && !isInjectionEager(parameterSpec);
}

