import { type FonctionAgregation } from './indicateur'
import { TOUS_ID } from './modaliteTree'
import {
  type ContributionSource,
  type ValeurAvancementApiModel,
  type ValeursCombinaisonApiModel,
} from './valeurAvancement'

// Lecture, cellule par cellule, des séries renvoyées par
// `GET /indicateurs/{id}/valeurs-par-combinaison` : l'API calcule toutes les valeurs (parentes,
// « Tous », agrégats d'individus), on ne fait qu'en déduire le statut de chaque cellule à
// chaque période, et d'où vient sa valeur.

// Une combinaison : pour chaque axe déclaré, l'id d'une modalité ou `TOUS_ID`, dans l'ordre
// de déclaration.
export type CombinaisonIds = ReadonlyArray<string>

export const combinaisonKey = (ids: CombinaisonIds): string => ids.join('|')

// - saisie : valeur saisie à cette période ;
// - reportee : rien de saisi à cette période, la dernière valeur saisie est reportée ;
// - manquante : la combinaison a des valeurs, mais pas encore à cette période ;
// - absente : jamais de valeur, elle n'existe pas pour l'individu et sort du calcul ;
// - calculee : agrégée par l'API (modalité parente, « Tous » ou individu agrégé).
export type StatutCellule = 'saisie' | 'reportee' | 'manquante' | 'absente' | 'calculee'

export type CelluleValeur = {
  value: number | null
  statut: StatutCellule
  present: number
  expected: number
  // Le point de l'API retenu à cette période (le dernier à cette date ou avant).
  point: ValeurAvancementApiModel | null
}

const ABSENTE: CelluleValeur = {
  value: null,
  statut: 'absente',
  present: 0,
  expected: 0,
  point: null,
}

export const buildAxeIndexByModalite = (
  axes: ReadonlyArray<{ modalites: ReadonlyArray<{ id: string }> }>,
): ReadonlyMap<string, number> =>
  new Map(
    axes.flatMap((axe, index) => axe.modalites.map((modalite) => [modalite.id, index] as const)),
  )

// L'API ne cite que les axes fixés ; un axe absent vaut « Tous ».
export const toCombinaisonIds = ({
  modalites,
  axeIndexByModalite,
  axesCount,
}: {
  modalites: ReadonlyArray<string>
  axeIndexByModalite: ReadonlyMap<string, number>
  axesCount: number
}): CombinaisonIds => {
  const ids = Array.from({ length: axesCount }, () => TOUS_ID)
  for (const modalite of modalites) {
    const index = axeIndexByModalite.get(modalite)
    if (index !== undefined) ids[index] = modalite
  }
  return ids
}

export type SeriesByCombinaison = ReadonlyMap<string, ReadonlyArray<ValeurAvancementApiModel>>

export const buildSeriesByCombinaison = ({
  items,
  axeIndexByModalite,
  axesCount,
}: {
  items: ReadonlyArray<ValeursCombinaisonApiModel>
  axeIndexByModalite: ReadonlyMap<string, number>
  axesCount: number
}): SeriesByCombinaison =>
  new Map(
    items.map((item) => [
      combinaisonKey(
        toCombinaisonIds({ modalites: item.modalites, axeIndexByModalite, axesCount }),
      ),
      item.valeurs.toSorted((left, right) => left.date.localeCompare(right.date)),
    ]),
  )

// Les périodes du tableau : chaque date où au moins une combinaison a un point. Entre deux de
// ces dates, aucune valeur ne change.
export const listPeriodes = (series: SeriesByCombinaison): string[] =>
  [...new Set([...series.values()].flatMap((valeurs) => valeurs.map((point) => point.date)))].sort()

const findLastAtOrBefore = ({
  valeurs,
  periode,
}: {
  valeurs: ReadonlyArray<ValeurAvancementApiModel>
  periode: string
}): ValeurAvancementApiModel | null => valeurs.findLast((point) => point.date <= periode) ?? null

export const resolveCellule = ({
  valeurs,
  periode,
}: {
  valeurs: ReadonlyArray<ValeurAvancementApiModel> | undefined
  periode: string
}): CelluleValeur => {
  if (!valeurs || valeurs.length === 0) return ABSENTE
  const point = findLastAtOrBefore({ valeurs, periode })
  if (!point) return { value: null, statut: 'manquante', present: 0, expected: 1, point: null }
  if (point.type === 'derivee') {
    return {
      value: point.valeur,
      statut: 'calculee',
      present: point.couverture.nbEnfantsAvecValeur,
      expected: point.couverture.nbEnfantsTotal,
      point,
    }
  }
  const statut = point.date === periode ? 'saisie' : 'reportee'
  return { value: point.valeur, statut, present: 1, expected: 1, point }
}

export type TermeExplication = {
  // Combinaison de la contribution ; pour un agrégat d'individus, la même que la cellule.
  ids: CombinaisonIds
  individu: string
  valeur: number | null
  source: ContributionSource
  date: string | null
}

export type ExplicationCellule =
  | { kind: 'saisie'; date: string; valeur: number }
  | { kind: 'reportee'; date: string; valeur: number }
  | { kind: 'manquante' }
  | { kind: 'absente' }
  | {
      // L'API descend un axe : les termes sont les modalités enfants de la cellule.
      kind: 'axe'
      axeIndex: number
      fonction: FonctionAgregation
      date: string
      termes: ReadonlyArray<TermeExplication>
    }
  | {
      // L'individu se calcule à partir de ses individus enfants, sur la même combinaison.
      kind: 'individus'
      fonction: FonctionAgregation
      date: string
      termes: ReadonlyArray<TermeExplication>
    }

const differingAxe = ({ ids, other }: { ids: CombinaisonIds; other: CombinaisonIds }): number =>
  ids.findIndex((id, index) => id !== other[index])

export const explainCellule = ({
  cellule,
  ids,
  axeIndexByModalite,
}: {
  cellule: CelluleValeur
  ids: CombinaisonIds
  axeIndexByModalite: ReadonlyMap<string, number>
}): ExplicationCellule => {
  const { point } = cellule
  if (!point) return { kind: cellule.statut === 'manquante' ? 'manquante' : 'absente' }
  if (point.type === 'saisie') {
    const kind = cellule.statut === 'reportee' ? 'reportee' : 'saisie'
    return { kind, date: point.date, valeur: point.valeur }
  }
  const termes = point.contributions.map((contribution): TermeExplication => ({
    ids: toCombinaisonIds({
      modalites: contribution.modalites ?? [],
      axeIndexByModalite,
      axesCount: ids.length,
    }),
    individu: contribution.individu,
    valeur: contribution.valeur,
    source: contribution.source,
    date: contribution.date,
  }))
  const isAgregationIndividus = point.contributions.some(
    (contribution) => contribution.individu !== point.individu,
  )
  if (isAgregationIndividus) {
    return { kind: 'individus', fonction: point.fonctionAgregation, date: point.date, termes }
  }
  const axeIndex = termes
    .map((terme) => differingAxe({ ids, other: terme.ids }))
    .find((index) => index >= 0)
  return {
    kind: 'axe',
    axeIndex: axeIndex ?? 0,
    fonction: point.fonctionAgregation,
    date: point.date,
    termes,
  }
}
