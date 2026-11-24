import { uniq } from 'es-toolkit'

import {
  type CiblesSaisie,
  type ColonneRapprochee,
  type PlanTransformation,
  type Rapprochement,
  type TableauSource,
} from '../valeurImport'
import { matchLibellesExact } from './matchLibellesExact'

// Construction et retouche d'un plan sans IA : le plan d'un fichier au format
// standard, et la correction d'un rapprochement par l'utilisateur.

// Libellés distincts d'une colonne, dans l'ordre du fichier, sans les cellules vides.
export const listLibelles = ({
  tableau,
  colonne,
}: {
  tableau: TableauSource
  colonne: string
}): string[] => {
  const index = tableau.entetes.indexOf(colonne)
  if (index === -1) return []
  const libelles = tableau.lignes.map((ligne) => String(ligne[index] ?? '').trim())
  return uniq(libelles.filter((libelle) => libelle !== ''))
}

const COLONNES_STANDARD = { individu: 'individu', date: 'date', valeur: 'valeur' }

// Colonnes du format standard : `individu`, une colonne par axe (en-tête = son
// identifiant public), `date`, `valeur`.
export const listColonnesStandard = ({
  cibles,
}: {
  cibles: Pick<CiblesSaisie, 'axes'>
}): string[] => [
  COLONNES_STANDARD.individu,
  ...cibles.axes.map((axe) => axe.id),
  COLONNES_STANDARD.date,
  COLONNES_STANDARD.valeur,
]

const matchColonne = ({
  tableau,
  colonne,
  candidats,
}: {
  tableau: TableauSource
  colonne: string
  candidats: ReadonlyArray<{ id: string; nom: string }>
}): ColonneRapprochee => {
  const libelles = listLibelles({ tableau, colonne })
  const { rapprochements, restants } = matchLibellesExact({ libelles, candidats })
  const inconnus = Object.fromEntries(
    restants.map((libelle): [string, Rapprochement] => [libelle, { statut: 'INCONNU' }]),
  )
  return { colonne, rapprochements: { ...rapprochements, ...inconnus } }
}

export type PlanStandard =
  { ok: true; plan: PlanTransformation } | { ok: false; colonnesManquantes: string[] }

// Un fichier au format standard n'a pas besoin d'Albert : ses en-têtes disent
// déjà le rôle de chaque colonne (casse libre). Les libellés se rapprochent par
// correspondance exacte, les autres restent à corriger.
export const buildPlanStandard = ({
  tableau,
  cibles,
}: {
  tableau: TableauSource
  cibles: CiblesSaisie
}): PlanStandard => {
  const enteteByKey = new Map(
    tableau.entetes.map((entete) => [entete.trim().toLowerCase(), entete]),
  )
  const findEntete = (colonne: string): string | undefined => enteteByKey.get(colonne.toLowerCase())

  const colonnesManquantes = listColonnesStandard({ cibles }).filter(
    (colonne) => findEntete(colonne) === undefined,
  )
  if (colonnesManquantes.length > 0) return { ok: false, colonnesManquantes }

  return {
    ok: true,
    plan: {
      individu: matchColonne({
        tableau,
        colonne: findEntete(COLONNES_STANDARD.individu)!,
        candidats: cibles.individus,
      }),
      axes: cibles.axes.map((axe) => ({
        axe: axe.id,
        ...matchColonne({ tableau, colonne: findEntete(axe.id)!, candidats: axe.modalites }),
      })),
      valeurs: {
        disposition: 'LIGNES',
        colonneDate: findEntete(COLONNES_STANDARD.date)!,
        colonneValeur: findEntete(COLONNES_STANDARD.valeur)!,
      },
    },
  }
}

export type CibleRapprochement = { type: 'INDIVIDU' } | { type: 'AXE'; axe: string }

// Correction d'un rapprochement par l'utilisateur : elle porte sur le libellé,
// donc sur toutes les lignes qui le contiennent.
export const setRapprochement = ({
  plan,
  cible,
  libelle,
  publicId,
}: {
  plan: PlanTransformation
  cible: CibleRapprochement
  libelle: string
  publicId: string
}): PlanTransformation => {
  const rapprochement: Rapprochement = { statut: 'RESOLU', publicId, par: 'UTILISATEUR' }
  if (cible.type === 'INDIVIDU') {
    return {
      ...plan,
      individu: {
        ...plan.individu,
        rapprochements: { ...plan.individu.rapprochements, [libelle]: rapprochement },
      },
    }
  }
  return {
    ...plan,
    axes: plan.axes.map((axe) =>
      axe.axe === cible.axe
        ? { ...axe, rapprochements: { ...axe.rapprochements, [libelle]: rapprochement } }
        : axe,
    ),
  }
}
