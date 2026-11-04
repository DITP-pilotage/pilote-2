import { type EntityRef, type ToolInput } from '@pilote/kpilote-shared/assistant/tools'

import {
  findIndicateurNamesByIds,
  findIndividu,
  findReadableCollection,
} from '@/assistant/tools/entityLookups'
import { findReadableIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

/** Ce que le sous-agent peut référencer : seulement des entités que l'utilisateur lit. */
export type DashboardContext = {
  indicateurs: Array<EntityRef & { referentielIds: string[] }>
  /** `indicateurIds` sert à nommer les contributions ; le sous-agent ne le voit pas. */
  collections: Array<EntityRef & { indicateurIds: string[] }>
  individus: EntityRef[]
  referentiels: Array<EntityRef & { carte: boolean }>
}

const CARTE_WIDGET_PREFIX = 'carte-france-'

const readAll = async <T>(
  ids: ReadonlyArray<string> | undefined,
  read: (id: string) => Promise<T | null>,
): Promise<{ found: T[]; missing: string[] }> => {
  const unique = [...new Set(ids ?? [])]
  const rows = await Promise.all(unique.map(read))
  return {
    found: rows.filter((row): row is NonNullable<typeof row> & T => row !== null),
    missing: unique.filter((_, index) => rows[index] === null),
  }
}

export const resolveDashboardContext = async (
  input: ToolInput<'create_dashboard'>,
): Promise<DashboardContext> => {
  const [indicateurs, collections, individus] = await Promise.all([
    readAll(input.indicateurIds, findReadableIndicateur),
    readAll(input.collectionIds, findReadableCollection),
    readAll(input.individuIds, findIndividu),
  ])

  const referentielIds = [
    ...new Set([
      ...(input.referentielIds ?? []),
      ...indicateurs.found.flatMap((indicateur) => indicateur.referentiels.map(({ id }) => id)),
    ]),
  ]
  const referentiels = await db().referentiel.findMany({
    where: { publicId: { in: referentielIds } },
    select: {
      publicId: true,
      nom: true,
      widgets: { select: { widget: { select: { type: true } } } },
    },
    orderBy: { publicId: 'asc' },
  })
  const foundReferentiels = new Set(referentiels.map((row) => row.publicId))

  const missing = [
    ...indicateurs.missing,
    ...collections.missing,
    ...individus.missing,
    ...(input.referentielIds ?? []).filter((id) => !foundReferentiels.has(id)),
  ]
  if (missing.length > 0) {
    throw new ValidationError(
      `Identifiants inexistants ou que l'utilisateur ne peut pas consulter : ${missing.join(', ')}. Ne les mets pas dans le dashboard.`,
    )
  }

  return {
    indicateurs: indicateurs.found.map((indicateur) => ({
      id: indicateur.id,
      nom: indicateur.nom,
      referentielIds: indicateur.referentiels.map(({ id }) => id),
    })),
    collections: collections.found.map((collection) => ({
      id: collection.id,
      nom: collection.nom,
      indicateurIds: collection.indicateurs.map(({ id }) => id),
    })),
    individus: individus.found,
    referentiels: referentiels.map((row) => ({
      id: row.publicId,
      nom: row.nom,
      carte: row.widgets.some(({ widget }) => widget.type.startsWith(CARTE_WIDGET_PREFIX)),
    })),
  }
}

/**
 * Les noms affichés par les widgets, indicateurs des collections compris ; un indicateur
 * illisible d'une collection n'est pas nommé.
 */
export const dashboardLabels = async (
  context: DashboardContext,
): Promise<Record<string, string>> => {
  const contributions = await findIndicateurNamesByIds(
    context.collections.flatMap((collection) => collection.indicateurIds),
  )
  return Object.fromEntries([
    ...contributions,
    ...[
      ...context.indicateurs,
      ...context.collections,
      ...context.individus,
      ...context.referentiels,
    ].map((entity) => [entity.id, entity.nom] as const),
  ])
}
