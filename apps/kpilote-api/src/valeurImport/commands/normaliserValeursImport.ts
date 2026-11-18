import { okAsync, ResultAsync } from 'neverthrow'

import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import {
  appliquerPlan,
  type AxeColumn,
  type ItemNormalise,
  type ResultatApplication,
  type WarningApplication,
} from '@/valeurImport/appliquerPlan'
import { decouvrirStructure, type Plan } from '@/valeurImport/calls/decouvrirStructure'
import {
  resoudreIndividus,
  type ResolutionEntry,
  type ResolutionNonResolu,
} from '@/valeurImport/calls/resoudreIndividus'
import { resolveColumnModalites } from '@/valeurImport/calls/resolveColumnModalites'
import { resoudreTypeValeur } from '@/valeurImport/calls/resoudreTypeValeur'
import { selectAxeColumns } from '@/valeurImport/axeColumns'
import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'
import { resoudreColonneTypeValeur } from '@/valeurImport/helpers/resoudreColonneTypeValeur'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import {
  type AxeForImport,
  listAxesForIndicateur,
} from '@/valeurImport/queries/listAxesForIndicateur'
import { listIndividusForIndicateur } from '@/valeurImport/queries/listIndividusForIndicateur'

export type AxeColumnResolution = {
  colonne: string
  axe: string
  mapping: Array<{ libelleSource: string; modalitePublicId: string }>
  nonResolus: Array<{ libelleSource: string; raison: string }>
}

export type NormaliserValeursImportResult = {
  plan: Plan
  resolution: {
    mapping: ResolutionEntry[]
    nonResolus: ResolutionNonResolu[]
    // Indicateur à axes seulement.
    colonnesAxes?: AxeColumnResolution[]
  }
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
  | { type: 'PLAN_ECHEC'; raison: string; explication: string }
  | { type: 'RESOLUTION_ECHEC'; derniereErreur: unknown }

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
  return resoudreTypeValeur({ colonne, typesValeurDistincts }).map((res) => ({
    colonne,
    typesValeurDistincts,
    typesValeurRetenus: res.typesValeurRetenus,
  }))
}

type AxesResolution = {
  // Une entrée par axe couvert par une colonne du fichier, dans l'ordre des axes.
  axes: AxeColumn[]
  // Tous les axes de l'indicateur ont une colonne : sinon aucune ligne n'est complète.
  complete: boolean
  warnings: WarningApplication[]
}

// Indicateur à axes : retient la colonne de chaque axe proposée par Albert, puis
// résout ses libellés contre les modalités de cet axe.
const resolveAxesStep = ({
  indicateur,
  plan,
  rows,
  headers,
  axes,
}: {
  indicateur: { nom: string }
  plan: Plan
  rows: Array<Record<string, unknown>>
  headers: string[]
  axes: ReadonlyArray<AxeForImport>
}): ResultAsync<AxesResolution, NormaliserValeursImportError> => {
  if (axes.length === 0) return okAsync({ axes: [], complete: true, warnings: [] })
  const { columns, warnings } = selectAxeColumns({ plan, headers, axes })
  return ResultAsync.combine(
    columns.map(({ column, axe }) =>
      resolveColumnModalites({
        indicateur,
        axe,
        column,
        labels: extraireLibellesSources(rows, column),
      }).map((resolution): AxeColumn => ({
        column,
        axe: { publicId: axe.publicId, nom: axe.nom },
        validModalites: new Set(axe.modalitesFeuilles.map((modalite) => modalite.publicId)),
        resolution,
      })),
    ),
  ).map((resolvedAxes) => ({
    axes: resolvedAxes,
    complete: resolvedAxes.length === axes.length,
    warnings,
  }))
}

const toAxeColumnResolution = (axe: AxeColumn): AxeColumnResolution => ({
  colonne: axe.column,
  axe: axe.axe.publicId,
  mapping: axe.resolution.mapping.map(({ libelleSource, publicId }) => ({
    libelleSource,
    modalitePublicId: publicId,
  })),
  nonResolus: [...axe.resolution.nonResolus],
})

export const normaliserValeursImport = (
  indicateurPublicId: string,
  { rows, nomFichier }: { rows: Array<Record<string, unknown>>; nomFichier: string },
): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> =>
  getIndicateurByPublicId(indicateurPublicId)
    .andThen((indicateur) =>
      ResultAsync.combine([
        listIndividusForIndicateur(indicateurPublicId),
        listAxesForIndicateur(indicateurPublicId),
      ] as const).map(([individus, axes]) => ({ indicateur, individus, axes })),
    )
    .andThen(({ indicateur, individus, axes }) => {
      const headers = collectHeaders(rows)
      return decouvrirStructure({
        indicateur: { nom: indicateur.nom, uniteLibelle: indicateur.unite?.libelle ?? null },
        headers,
        rows,
        nomFichier,
        axes,
      }).andThen((plan) => {
        const libellesSources = extraireLibellesSources(rows, plan.colonneIndividu)

        return resoudreEtapeTypeValeur({ plan, rows, headers }).andThen((resolutionTypeValeur) =>
          resoudreIndividus({
            indicateur: { nom: indicateur.nom },
            individusValides: individus,
            libellesSources,
          }).andThen((resolution) =>
            resolveAxesStep({
              indicateur: { nom: indicateur.nom },
              plan,
              rows,
              headers,
              axes,
            }).map((axesResolution) => {
              const application: ResultatApplication = axesResolution.complete
                ? appliquerPlan({
                    plan,
                    rows,
                    resolution,
                    individusValides: individus,
                    typeValeur: resolutionTypeValeur,
                    axes: axesResolution.axes,
                  })
                : { items: [], warnings: [] }
              return {
                plan,
                resolution: {
                  mapping: [...resolution.mapping],
                  nonResolus: [...resolution.nonResolus],
                  ...(axes.length > 0
                    ? { colonnesAxes: axesResolution.axes.map(toAxeColumnResolution) }
                    : {}),
                },
                items: application.items,
                warnings: [...axesResolution.warnings, ...application.warnings],
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
          ),
        )
      })
    })
