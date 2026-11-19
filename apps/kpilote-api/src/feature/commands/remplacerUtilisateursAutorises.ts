import {
  type FeatureDetailApiModel,
  type RemplacerUtilisateursAutorisesBody,
} from '@pilote/kpilote-shared/feature'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { diff } from '@/framework/collections/diff'
import { findUnknown } from '@/framework/collections/findUnknown'
import { db } from '@/framework/persistence/dbStore'
import { featureInclude, toFeatureDetailApiModel } from '@/feature/utils'

export type RemplacerUtilisateursAutorisesError = {
  type: 'UTILISATEURS_INCONNUS'
  utilisateurs: string[]
}

// findUniqueOrThrow lève Prisma P2025 (→ 404) si la feature n'existe pas.
const ensureFeatureExiste = async (id: string): Promise<void> => {
  await db().feature.findUniqueOrThrow({ where: { id }, select: { id: true } })
}

const replaceUtilisateursAutorises = async ({
  featureId,
  utilisateurIds,
}: {
  featureId: string
  utilisateurIds: ReadonlyArray<string>
}): Promise<void> => {
  const existantes = await db().featureUtilisateur.findMany({ where: { featureId } })
  const { toAdd, toRemove } = diff(
    [...new Set(utilisateurIds)],
    existantes.map((liaison) => liaison.utilisateurId),
  )
  if (toRemove.length > 0) {
    await db().featureUtilisateur.deleteMany({
      where: { featureId, utilisateurId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().featureUtilisateur.createMany({
      data: toAdd.map((utilisateurId) => ({ featureId, utilisateurId })),
    })
  }
}

const performRemplacer = async (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): Promise<Result<FeatureDetailApiModel, RemplacerUtilisateursAutorisesError>> => {
  ensureAdmin()
  await ensureFeatureExiste(id)

  const utilisateurs = await db().utilisateur.findMany({
    where: { id: { in: body.utilisateurIds } },
  })
  const inconnus = findUnknown({
    requested: body.utilisateurIds,
    found: utilisateurs.map((utilisateur) => utilisateur.id),
  })
  if (inconnus.length > 0) return err({ type: 'UTILISATEURS_INCONNUS', utilisateurs: inconnus })

  await replaceUtilisateursAutorises({ featureId: id, utilisateurIds: body.utilisateurIds })
  const row = await db().feature.findUniqueOrThrow({
    where: { id },
    include: featureInclude,
  })
  return ok(toFeatureDetailApiModel(row))
}

export const remplacerUtilisateursAutorises = (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): ResultAsync<FeatureDetailApiModel, RemplacerUtilisateursAutorisesError> =>
  new ResultAsync(performRemplacer(id, body))
