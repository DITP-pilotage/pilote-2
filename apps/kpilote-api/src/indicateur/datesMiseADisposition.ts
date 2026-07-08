import { Temporal } from '@js-temporal/polyfill'

import {
  type DelaiMiseADisposition,
  type PeriodeMiseAJour,
  type UniteDuree,
} from '@pilote/kpilote-shared/indicateur'

export type DatesMiseADisposition = {
  dateDerniereValeur: string | null
  dateProchaineValeur: string | null
  dateMiseADisposition: string | null
}

// Intervalle à ajouter à la dernière valeur connue pour obtenir la prochaine
// occurrence théorique. `BIMENSUELLE` (2×/mois) est approximée à 15 jours ;
// `AUCUNE` n'a pas d'occurrence suivante.
const DUREE_PAR_PERIODE: Record<PeriodeMiseAJour, Temporal.DurationLike | null> = {
  QUOTIDIENNE: { days: 1 },
  HEBDOMADAIRE: { days: 7 },
  BIMENSUELLE: { days: 15 },
  MENSUELLE: { months: 1 },
  TRIMESTRIELLE: { months: 3 },
  SEMESTRIELLE: { months: 6 },
  ANNUELLE: { years: 1 },
  AUCUNE: null,
}

const UNITE_DUREE_TO_TEMPORAL: Record<UniteDuree, 'days' | 'weeks' | 'months' | 'years'> = {
  JOURS: 'days',
  SEMAINES: 'weeks',
  MOIS: 'months',
  ANNEES: 'years',
}

// `Temporal.PlainDate.add` utilise overflow: 'constrain' par défaut : 31 janv.
// + 1 mois → dernier jour de février (clamp), ce qui correspond au besoin.
const ajouter = (date: string, duree: Temporal.DurationLike): string =>
  Temporal.PlainDate.from(date).add(duree).toString()

const computeProchaineValeur = (
  dateDerniereValeur: string | null,
  periodeMiseAJour: PeriodeMiseAJour | null,
): string | null => {
  if (dateDerniereValeur === null || periodeMiseAJour === null) return null
  const duree = DUREE_PAR_PERIODE[periodeMiseAJour]
  if (duree === null) return null
  return ajouter(dateDerniereValeur, duree)
}

const computeMiseADisposition = (
  dateProchaineValeur: string | null,
  delai: DelaiMiseADisposition | null,
): string | null => {
  if (dateProchaineValeur === null || delai === null) return null
  return ajouter(dateProchaineValeur, { [UNITE_DUREE_TO_TEMPORAL[delai.unite]]: delai.nombre })
}

export const computeDatesMiseADisposition = ({
  dateDerniereValeur,
  periodeMiseAJour,
  delai,
}: {
  dateDerniereValeur: string | null
  periodeMiseAJour: PeriodeMiseAJour | null
  delai: DelaiMiseADisposition | null
}): DatesMiseADisposition => {
  const dateProchaineValeur = computeProchaineValeur(dateDerniereValeur, periodeMiseAJour)
  return {
    dateDerniereValeur,
    dateProchaineValeur,
    dateMiseADisposition: computeMiseADisposition(dateProchaineValeur, delai),
  }
}
