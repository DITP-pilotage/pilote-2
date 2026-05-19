import {
  type ContributionApiModel,
  type CouvertureApiModel,
} from '@pilote/mb-shared/valeurAvancement'

import { Decimal } from '@/framework/decimal'
import { computeSum } from '@/valeurAvancement/computeSum'

export type IndividuRef = {
  id: string
  publicId: string
}

export type ValeurSaisie = {
  valeur: Decimal
  date: string
}

export type ResolveValeurDeriveeContext = {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  derniereValeurParIndividu: ReadonlyMap<string, ValeurSaisie>
}

export type ResolveValeurDeriveeResult = {
  contributions: ContributionApiModel[]
  valeurDerivee: number | null
  couverture: CouvertureApiModel
}

type ValeurEffective = {
  valeur: Decimal
  date: string
  source: 'saisie' | 'derivee'
}

const maxDate = (a: string, b: string): string => (a > b ? a : b)

const resolveValeurEffective = (
  individuId: string,
  context: ResolveValeurDeriveeContext,
): ValeurEffective | null => {
  const saisie = context.derniereValeurParIndividu.get(individuId)
  if (saisie) {
    return { valeur: saisie.valeur, date: saisie.date, source: 'saisie' }
  }

  const enfants = context.enfantsParParent.get(individuId)
  if (!enfants || enfants.length === 0) return null

  const sousValeurs = enfants
    .map((enfant) => resolveValeurEffective(enfant.id, context))
    .filter((v): v is ValeurEffective => v !== null)
  if (sousValeurs.length === 0) return null

  const somme = sousValeurs.reduce((acc, v) => acc.plus(v.valeur), new Decimal(0))
  const date = sousValeurs.reduce((acc, v) => maxDate(acc, v.date), sousValeurs[0]!.date)
  return { valeur: somme, date, source: 'derivee' }
}

export const resolveValeurDerivee = (
  cibleId: string,
  context: ResolveValeurDeriveeContext,
): ResolveValeurDeriveeResult => {
  const enfants = context.enfantsParParent.get(cibleId) ?? []
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  const contributions: ContributionApiModel[] = []
  const valeursPourSomme: Decimal[] = []

  for (const enfant of enfantsTries) {
    const effective = resolveValeurEffective(enfant.id, context)
    if (effective === null) {
      contributions.push({
        individu: enfant.publicId,
        valeur: null,
        date: null,
        source: 'manquante',
      })
      continue
    }
    contributions.push({
      individu: enfant.publicId,
      valeur: effective.valeur.toNumber(),
      date: effective.date,
      source: effective.source,
    })
    valeursPourSomme.push(effective.valeur)
  }

  return {
    contributions,
    valeurDerivee: computeSum(valeursPourSomme),
    couverture: {
      nbEnfantsAvecValeur: valeursPourSomme.length,
      nbEnfantsTotal: enfantsTries.length,
    },
  }
}
