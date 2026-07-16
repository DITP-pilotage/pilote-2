import { okAsync, ResultAsync } from 'neverthrow'

import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import {
  appliquerPlan,
  type ItemNormalise,
  type WarningApplication,
} from '@/valeurImport/appliquerPlan'
import {
  decouvrirStructure,
  type DecouvrirStructureError,
  type Plan,
} from '@/valeurImport/calls/decouvrirStructure'
import {
  resoudreIndividus,
  type ResolutionEntry,
  type ResolutionNonResolu,
  type ResoudreIndividusError,
} from '@/valeurImport/calls/resoudreIndividus'
import {
  resoudreTypeValeur,
  type ResoudreTypeValeurError,
} from '@/valeurImport/calls/resoudreTypeValeur'
import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'
import { resoudreColonneTypeValeur } from '@/valeurImport/helpers/resoudreColonneTypeValeur'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { listIndividusForIndicateur } from '@/valeurImport/queries/listIndividusForIndicateur'

export type NormaliserValeursImportResult = {
  plan: Plan
  resolution: { mapping: ResolutionEntry[]; nonResolus: ResolutionNonResolu[] }
  items: ItemNormalise[]
  warnings: WarningApplication[]
  rapport: {
    totalLignes: number
    totalItemsProduits: number
    totalLibellesSources: number
    totalLibellesMappes: number
    totalLibellesNonResolus: number
  }
  resolutionTypeValeur?: {
    colonne: string
    typesValeurDistincts: string[]
    typesValeurRetenus: string[]
  }
}

export type NormaliserValeursImportError =
  | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }
  | { type: 'PLAN_ECHEC'; raison: string; explication: string }
  | { type: 'RESOLUTION_ECHEC'; derniereErreur: unknown }

const mapAlbertError = (error: DecouvrirStructureError): NormaliserValeursImportError =>
  error.type === 'PLAN_ECHEC'
    ? { type: 'PLAN_ECHEC', raison: error.raison, explication: error.explication }
    : { type: 'ALBERT_UNAVAILABLE', cause: error.cause }

const mapResolutionError = (error: ResoudreIndividusError): NormaliserValeursImportError =>
  error.type === 'RESOLUTION_ECHEC'
    ? { type: 'RESOLUTION_ECHEC', derniereErreur: error.derniereErreur }
    : { type: 'ALBERT_UNAVAILABLE', cause: error.cause }

const mapTypeValeurError = (error: ResoudreTypeValeurError): NormaliserValeursImportError => ({
  type: 'ALBERT_UNAVAILABLE',
  cause: error.cause,
})

const collectHeaders = (rows: ReadonlyArray<Record<string, unknown>>): string[] => {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        ordered.push(key)
      }
    }
  }
  return ordered
}

const extraireLibellesSources = (
  rows: ReadonlyArray<Record<string, unknown>>,
  colonneIndividu: string,
): string[] => {
  const set = new Set<string>()
  for (const row of rows) {
    const valeur = row[colonneIndividu]
    if (valeur === null || valeur === undefined) continue
    const libelle = safeStringify(valeur).trim()
    if (libelle) set.add(libelle)
  }
  return [...set]
}

type ResolutionTypeValeur = NonNullable<NormaliserValeursImportResult['resolutionTypeValeur']>

// Passe 1b (conditionnelle) : résolution sémantique du type de valeur (fichiers PPG).
// On ne retient la colonne que si Albert a fourni un nom valide et réel (il remplit
// parfois ce champ optionnel avec un nom vide ou halluciné). Sinon → null (pas de filtre).
const resoudreEtapeTypeValeur = ({
  plan,
  rows,
  headers,
}: {
  plan: Plan
  rows: Array<Record<string, unknown>>
  headers: string[]
}): ResultAsync<ResolutionTypeValeur | null, NormaliserValeursImportError> => {
  const colonne = resoudreColonneTypeValeur({ colonneTypeValeur: plan.colonneTypeValeur, headers })
  if (!colonne) return okAsync(null)

  const typesValeurDistincts = collecterValeursDistinctes({ rows, colonne })
  return resoudreTypeValeur({ colonne, typesValeurDistincts })
    .mapErr(mapTypeValeurError)
    .map((res) => ({ colonne, typesValeurDistincts, typesValeurRetenus: res.typesValeurRetenus }))
}

export const normaliserValeursImport = (
  indicateurPublicId: string,
  { rows, nomFichier }: { rows: Array<Record<string, unknown>>; nomFichier: string },
): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> =>
  getIndicateurByPublicId(indicateurPublicId)
    .andThen((indicateur) =>
      listIndividusForIndicateur(indicateurPublicId).map((individus) => ({
        indicateur,
        individus,
      })),
    )
    .andThen(({ indicateur, individus }) => {
      const headers = collectHeaders(rows)
      return decouvrirStructure({
        indicateur: { nom: indicateur.nom, uniteLibelle: indicateur.unite?.libelle ?? null },
        headers,
        rows,
        nomFichier,
      })
        .mapErr(mapAlbertError)
        .andThen((plan) => {
          const libellesSources = extraireLibellesSources(rows, plan.colonneIndividu)

          return resoudreEtapeTypeValeur({ plan, rows, headers }).andThen((resolutionTypeValeur) =>
            resoudreIndividus({
              indicateur: { nom: indicateur.nom },
              individusValides: individus,
              libellesSources,
            })
              .mapErr(mapResolutionError)
              .map((resolution) => {
                const application = appliquerPlan({
                  plan,
                  rows,
                  resolution,
                  individusValides: individus,
                  typeValeur: resolutionTypeValeur,
                })
                return {
                  plan,
                  resolution: {
                    mapping: [...resolution.mapping],
                    nonResolus: [...resolution.nonResolus],
                  },
                  items: application.items,
                  warnings: application.warnings,
                  rapport: {
                    totalLignes: rows.length,
                    totalItemsProduits: application.items.length,
                    totalLibellesSources: libellesSources.length,
                    totalLibellesMappes: resolution.mapping.length,
                    totalLibellesNonResolus: resolution.nonResolus.length,
                  },
                  ...(resolutionTypeValeur ? { resolutionTypeValeur } : {}),
                }
              }),
          )
        })
    })
