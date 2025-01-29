import { FiltreAccueil } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';

const listeKeyPositiveBooleanExclusion = new Set(['brouillon']);

export const getQueryParamString = (filtres: object, filtresExclus: Set<string> = new Set(), init: Partial<FiltreAccueil> = {} as Partial<FiltreAccueil>): string => {
  return new URLSearchParams(Object.entries(filtres).map(([key, value]) => {
    const valeurAVerifier = init[key as keyof FiltreAccueil] !== undefined ? init[key as keyof FiltreAccueil] : value as string;
    return !filtresExclus.has(key)
    && ((listeKeyPositiveBooleanExclusion.has(key) && valeurAVerifier === false) || (!listeKeyPositiveBooleanExclusion.has(key) && valeurAVerifier))
    && String(valeurAVerifier).length > 0 ? [key, String(valeurAVerifier)] : [];
  },
  )
    .filter(value => value.length > 0)).toString();
};
