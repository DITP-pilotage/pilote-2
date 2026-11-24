import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import {
  type CombinaisonIds,
  combinaisonKey,
  type TermeExplication,
} from '@pilote/kpilote-shared/valeursCombinaison'
import { keyBy, partition, sumBy } from 'es-toolkit'

import { type AxeTableau } from '@/lib/axes/tableauValeurs'

export type TermeAffiche = {
  key: string
  nom: string
  valeur: number | null
  // Part du total, seulement en somme : une moyenne n'a pas de part.
  part: number | null
}

// Les termes d'un agrégat, du plus grand au plus petit ; ceux sans valeur à la fin.
export const orderTermes = ({
  termes,
  fonction,
  nomOf,
}: {
  termes: ReadonlyArray<TermeExplication>
  fonction: FonctionAgregation
  nomOf: (terme: TermeExplication) => string
}): TermeAffiche[] => {
  const [withValeur, withoutValeur] = partition(termes, (terme) => terme.valeur !== null)
  const total = sumBy(withValeur, (terme) => terme.valeur ?? 0)
  const hasPart = fonction === 'SUM' && total > 0
  const toAffiche = (terme: TermeExplication): TermeAffiche => ({
    key: `${terme.individu}|${combinaisonKey(terme.ids)}`,
    nom: nomOf(terme),
    valeur: terme.valeur,
    part: hasPart && terme.valeur !== null ? terme.valeur / total : null,
  })
  return [
    ...withValeur.toSorted((first, second) => (second.valeur ?? 0) - (first.valeur ?? 0)),
    ...withoutValeur,
  ].map(toAffiche)
}

export type ReferenceLine = { label: string; value: string }

// La référence d'une cellule, un axe par ligne : « Opérateur : Orange ».
export const referenceLinesOf = ({
  axes,
  ids,
}: {
  axes: ReadonlyArray<AxeTableau>
  ids: CombinaisonIds
}): ReferenceLine[] =>
  ids.map((id, index) => {
    const axe = axes[index]
    const nom = id === TOUS_ID ? 'Tous' : (axe?.tree.get(id)?.nom ?? id)
    return { label: axe?.nom ?? '', value: nom }
  })

// Les contributions ne portent que l'identifiant des individus ; sans le référentiel chargé, on
// affiche l'identifiant.
export const buildNomOfIndividu = (
  individus: ReadonlyArray<{ id: string; nom: string }> | undefined,
): ((individuId: string) => string) => {
  const individuById = keyBy(individus ?? [], (individu) => individu.id)
  return (individuId) => individuById[individuId]?.nom ?? individuId
}
