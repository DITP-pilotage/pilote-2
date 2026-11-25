import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import { Decimal } from '@/framework/decimal'

// Un individu est agrégé pour cet indicateur s'il a au moins un enfant direct
// ET que son référentiel est configuré avec une fonction d'agrégation active
// (≠ 'NONE').
export const getFonctionAgregationActive = ({
  individuId,
  hierarchy,
}: {
  individuId: string
  hierarchy: {
    enfantsByParent: ReadonlyMap<string, ReadonlyArray<{ id: string }>>
    fonctionAgregationByReferentiel: ReadonlyMap<string, FonctionAgregation>
    referentielByIndividu: ReadonlyMap<string, string>
  }
}): FonctionAgregation | null => {
  const enfants = hierarchy.enfantsByParent.get(individuId)
  if (!enfants || enfants.length === 0) return null
  const referentielId = hierarchy.referentielByIndividu.get(individuId)
  if (!referentielId) return null
  const fonction = hierarchy.fonctionAgregationByReferentiel.get(referentielId)
  if (!fonction || fonction === 'NONE') return null
  return fonction
}

// Précondition : `valeurs` est non vide et `fonction` est active (≠ 'NONE').
// `AVG` est une moyenne arithmétique simple non pondérée.
export const aggregate = ({
  valeurs,
  fonction,
}: {
  valeurs: ReadonlyArray<Decimal>
  fonction: FonctionAgregation
}): Decimal => {
  const somme = valeurs.reduce((acc, valeur) => acc.plus(valeur), new Decimal(0))
  switch (fonction) {
    case 'SUM':
      return somme
    case 'AVG':
      return somme.dividedBy(valeurs.length)
    case 'NONE':
      throw new Error(
        "aggregate appelé avec fonction 'NONE' : une dérivation ne devrait pas être déclenchée " +
          "lorsque l'agrégation est désactivée.",
      )
  }
}
