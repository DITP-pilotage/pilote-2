import { err, ok, Result, ResultAsync } from 'neverthrow'

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
  type ResolutionResult,
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
const resoudreEtapeTypeValeur = async ({
  plan,
  rows,
  headers,
}: {
  plan: Plan
  rows: Array<Record<string, unknown>>
  headers: string[]
}): Promise<Result<ResolutionTypeValeur | null, NormaliserValeursImportError>> => {
  const colonne = resoudreColonneTypeValeur({ colonneTypeValeur: plan.colonneTypeValeur, headers })
  if (!colonne) return ok(null)

  const typesValeurDistincts = collecterValeursDistinctes({ rows, colonne })
  const resolution = await resoudreTypeValeur({ colonne, typesValeurDistincts })
  if (resolution.isErr()) return err(resolution.error)
  return ok({
    colonne,
    typesValeurDistincts,
    typesValeurRetenus: resolution.value.typesValeurRetenus,
  })
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
const resolveAxesStep = async ({
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
}): Promise<Result<AxesResolution, NormaliserValeursImportError>> => {
  if (axes.length === 0) return ok({ axes: [], complete: true, warnings: [] })
  const { columns, warnings } = selectAxeColumns({ plan, headers, axes })
  // Une passe Albert par colonne d'axe, en parallèle.
  const resolutions = Result.combine(
    await Promise.all(
      columns.map(({ column, axe }) =>
        resolveColumnModalites({
          indicateur,
          axe,
          column,
          labels: extraireLibellesSources(rows, column),
        }),
      ),
    ),
  )
  if (resolutions.isErr()) return err(resolutions.error)
  const resolvedAxes = columns.map(({ column, axe }, index): AxeColumn => ({
    column,
    axe: { publicId: axe.publicId, nom: axe.nom },
    validModalites: new Set(axe.modalitesFeuilles.map((modalite) => modalite.publicId)),
    resolution: resolutions.value[index]!,
  }))
  return ok({ axes: resolvedAxes, complete: resolvedAxes.length === axes.length, warnings })
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

// Assemble le résultat renvoyé au client à partir des passes Albert. Sans
// colonne pour chaque axe, aucune ligne n'est complète : pas d'item.
const buildResult = ({
  plan,
  rows,
  individus,
  axes,
  libellesSources,
  resolution,
  resolutionTypeValeur,
  axesResolution,
}: {
  plan: Plan
  rows: Array<Record<string, unknown>>
  individus: ReadonlyArray<{ publicId: string }>
  axes: ReadonlyArray<AxeForImport>
  libellesSources: string[]
  resolution: ResolutionResult
  resolutionTypeValeur: ResolutionTypeValeur | null
  axesResolution: AxesResolution
}): NormaliserValeursImportResult => {
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
      ...(axes.length > 0 ? { colonnesAxes: axesResolution.axes.map(toAxeColumnResolution) } : {}),
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
}

const performNormaliser = async (
  indicateurPublicId: string,
  { rows, nomFichier }: { rows: Array<Record<string, unknown>>; nomFichier: string },
): Promise<Result<NormaliserValeursImportResult, NormaliserValeursImportError>> => {
  const indicateur = await getIndicateurByPublicId(indicateurPublicId)
  if (indicateur.isErr()) return err(indicateur.error)
  const contexte = await ResultAsync.combine([
    listIndividusForIndicateur(indicateurPublicId),
    listAxesForIndicateur(indicateurPublicId),
  ] as const)
  if (contexte.isErr()) return err(contexte.error)
  const [individus, axes] = contexte.value
  const { nom, unite } = indicateur.value

  const headers = collectHeaders(rows)
  const plan = await decouvrirStructure({
    indicateur: { nom, uniteLibelle: unite?.libelle ?? null },
    headers,
    rows,
    nomFichier,
    axes,
  })
  if (plan.isErr()) return err(plan.error)
  const libellesSources = extraireLibellesSources(rows, plan.value.colonneIndividu)

  const resolutionTypeValeur = await resoudreEtapeTypeValeur({ plan: plan.value, rows, headers })
  if (resolutionTypeValeur.isErr()) return err(resolutionTypeValeur.error)

  const resolution = await resoudreIndividus({
    indicateur: { nom },
    individusValides: individus,
    libellesSources,
  })
  if (resolution.isErr()) return err(resolution.error)

  const axesResolution = await resolveAxesStep({
    indicateur: { nom },
    plan: plan.value,
    rows,
    headers,
    axes,
  })
  if (axesResolution.isErr()) return err(axesResolution.error)

  return ok(
    buildResult({
      plan: plan.value,
      rows,
      individus,
      axes,
      libellesSources,
      resolution: resolution.value,
      resolutionTypeValeur: resolutionTypeValeur.value,
      axesResolution: axesResolution.value,
    }),
  )
}

export const normaliserValeursImport = (
  indicateurPublicId: string,
  input: { rows: Array<Record<string, unknown>>; nomFichier: string },
): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> =>
  new ResultAsync(performNormaliser(indicateurPublicId, input))
