const listeKeyPositiveBooleanExclusion = new Set(['brouillon']);

export const getQueryParamString = (filtres: object, filtresExclus: Set<string> = new Set()): string => {
  return new URLSearchParams(Object.entries(filtres).map(([key, value]) => (
    !filtresExclus.has(key)
    && ((listeKeyPositiveBooleanExclusion.has(key) && value === false) || (!listeKeyPositiveBooleanExclusion.has(key) && value))
    && String(value).length > 0 ? [key, String(value)] : []),
  )
    .filter(value => value.length > 0)).toString();
};
