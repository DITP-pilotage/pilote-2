import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

// Un individu est agrégé pour cet indicateur s'il a au moins un enfant direct
// ET que son référentiel est configuré avec une fonction d'agrégation active
// (≠ 'NONE'). 
export const getFonctionAgregationActive = (
  individuId: string,
  ctx: {
    enfantsParParent: ReadonlyMap<string, ReadonlyArray<{ id: string }>>
    fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
    referentielParIndividu: ReadonlyMap<string, string>
  },
): FonctionAgregation | null => {
  const enfants = ctx.enfantsParParent.get(individuId)
  if (!enfants || enfants.length === 0) return null
  const referentielId = ctx.referentielParIndividu.get(individuId)
  if (!referentielId) return null
  const fonction = ctx.fonctionAgregationParReferentiel.get(referentielId)
  if (!fonction || fonction === 'NONE') return null
  return fonction
}
