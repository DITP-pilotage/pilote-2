import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ListValeursByCombinaisonQuery,
  MAX_COMBINAISONS_PAR_LECTURE,
  type ValeursByCombinaisonListApiModel,
  type ValeursCombinaisonApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { groupBy } from 'es-toolkit'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type Selection } from '@/axe/modalites'
import { isFeatureActive } from '@/feature/isFeatureActive'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import {
  loadAxesIndicateur,
  loadResolveSerieContext,
} from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type PointInterne, resolveSerieNoeud } from '@/valeurAvancement/resolveSerieNoeud'
import { toValeurAvancementResumeApiModel } from '@/valeurAvancement/utils'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'
const FEATURE_TABLEAU_VALEURS = 'TABLEAU_VALEURS'

export type ListValeursByCombinaisonError = {
  type: 'TROP_DE_COMBINAISONS'
  combinaisons: number
  max: number
}

// Toutes les sélections du cube : pour chaque axe, « Tous » (axe absent de la sélection) ou
// l'une de ses modalités, feuille ou parente.
const buildSelections = ({
  axeIds,
  modaliteIdsByAxe,
}: {
  axeIds: ReadonlyArray<string>
  modaliteIdsByAxe: Readonly<Record<string, ReadonlyArray<string>>>
}): Selection[] =>
  axeIds.reduce<Selection[]>(
    (selections, axeId) =>
      selections.flatMap((selection) => [
        selection,
        ...(modaliteIdsByAxe[axeId] ?? []).map((modaliteId) =>
          new Map(selection).set(axeId, modaliteId),
        ),
      ]),
    [new Map()],
  )

const countCombinaisons = ({
  axeIds,
  modaliteIdsByAxe,
}: {
  axeIds: ReadonlyArray<string>
  modaliteIdsByAxe: Readonly<Record<string, ReadonlyArray<string>>>
}): number =>
  axeIds.reduce((total, axeId) => total * ((modaliteIdsByAxe[axeId]?.length ?? 0) + 1), 1)

const performList = async ({
  indicateurPublicId,
  params,
}: {
  indicateurPublicId: string
  params: ListValeursByCombinaisonQuery
}): Promise<Result<ValeursByCombinaisonListApiModel, ListValeursByCombinaisonError>> => {
  // Feature inactive : l'endpoint n'existe pas encore pour ce principal.
  if (!(await isFeatureActive(FEATURE_TABLEAU_VALEURS))) {
    throw new NotFoundError('La lecture des valeurs par combinaison n’est pas activée.')
  }
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })
  const [individu] = await loadIndividusParPublicId([params.individu])
  if (!individu) return ok({ items: [] })

  const axes = await loadAxesIndicateur(indicateur.id)
  const axeIds = axes.declarations.map((declaration) => declaration.axeId)
  const modaliteIdsByAxe = Object.fromEntries(
    Object.entries(groupBy(axes.modalites, (modalite) => modalite.axeId)).map(([axeId, liste]) => [
      axeId,
      liste.map((modalite) => modalite.id),
    ]),
  )
  const combinaisons = countCombinaisons({ axeIds, modaliteIdsByAxe })
  if (combinaisons > MAX_COMBINAISONS_PAR_LECTURE) {
    return err({ type: 'TROP_DE_COMBINAISONS', combinaisons, max: MAX_COMBINAISONS_PAR_LECTURE })
  }

  const { graphe, noeud } = await loadResolveSerieContext({
    indicateurId: indicateur.id,
    individusCibles: [individu],
    dateTrunc: params.dateTrunc ?? DEFAULT_DATE_TRUNC,
    axes,
  })
  // Un seul cache : un nœud partagé par plusieurs combinaisons ne se calcule qu'une fois.
  const cache = new Map<string, ReadonlyArray<PointInterne>>()
  const items: ValeursCombinaisonApiModel[] = []
  for (const selection of buildSelections({ axeIds, modaliteIdsByAxe })) {
    const cible = noeud({ individu, selection })
    const serie = await resolveSerieNoeud(cible, graphe, cache)
    if (serie.length === 0) continue
    items.push({
      modalites: [...cible.modalites],
      valeurs: serie.map((point) =>
        toValeurAvancementResumeApiModel({
          indicateurPublicId,
          individuPublicId: individu.publicId,
          point,
        }),
      ),
    })
  }
  return ok({ items })
}

// Les séries de toutes les combinaisons d'un individu (« Tous », modalités parentes et
// feuilles, sur chaque axe), calculées par le même moteur que `listValeursForIndicateur`.
export const listValeursByCombinaison = ({
  indicateurPublicId,
  params,
}: {
  indicateurPublicId: string
  params: ListValeursByCombinaisonQuery
}): ResultAsync<ValeursByCombinaisonListApiModel, ListValeursByCombinaisonError> =>
  new ResultAsync(performList({ indicateurPublicId, params }))

export const describeListValeursByCombinaisonError = (
  error: ListValeursByCombinaisonError,
): { status: 400; message: string; details: Record<string, unknown> } => {
  switch (error.type) {
    case 'TROP_DE_COMBINAISONS':
      return {
        status: 400,
        message: `Les axes de l’indicateur donnent ${error.combinaisons} combinaisons, au-delà de la limite de ${error.max}.`,
        details: { combinaisons: error.combinaisons, max: error.max },
      }
  }
}
