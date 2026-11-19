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
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type PointInterne, resolveSerieNoeud } from '@/valeurAvancement/resolveSerieNoeud'
import { toValeurAvancementApiModel } from '@/valeurAvancement/utils'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

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
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })
  const [individu] = await loadIndividusParPublicId([params.individu])
  if (!individu) return ok({ items: [] })

  const declarations = await db().indicateurAxe.findMany({
    where: { indicateurId: indicateur.id },
    orderBy: { ordre: 'asc' },
  })
  const axeIds = declarations.map((declaration) => declaration.axeId)
  const modalites = await db().modalite.findMany({ where: { axeId: { in: axeIds } } })
  const modaliteIdsByAxe = Object.fromEntries(
    Object.entries(groupBy(modalites, (modalite) => modalite.axeId)).map(([axeId, liste]) => [
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
        toValeurAvancementApiModel({
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
  ResultAsync.fromSafePromise(performList({ indicateurPublicId, params })).andThen(
    (result) => result,
  )

export const describeListValeursByCombinaisonError = (
  error: ListValeursByCombinaisonError,
): string => {
  switch (error.type) {
    case 'TROP_DE_COMBINAISONS':
      return `Les axes de l’indicateur donnent ${error.combinaisons} combinaisons, au-delà de la limite de ${error.max}.`
  }
}
