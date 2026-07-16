import {
  type FeatureDetailApiModel,
  type RemplacerUtilisateursAutorisesBody,
} from '@pilote/kpilote-shared/feature'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { featureInclude, toFeatureDetailApiModel } from '@/feature/utils'

// findUniqueOrThrow lève Prisma P2025 (→ 404) si la feature n'existe pas.
const ensureFeatureExiste = async (id: string): Promise<void> => {
  await db().feature.findUniqueOrThrow({ where: { id }, select: { id: true } })
}

const resoudreUtilisateurs = async (utilisateurIds: ReadonlyArray<string>): Promise<string[]> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return []
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  const idsInconnus = idsUniques.filter((id) => !idsTrouves.has(id))
  if (idsInconnus.length > 0) {
    throw new ValidationError('Utilisateurs inconnus', {
      unknownUtilisateurIds: idsInconnus.sort(),
    })
  }
  return idsUniques
}

const remplacerLiaisons = async (
  featureId: string,
  utilisateurIdsCibles: string[],
): Promise<void> => {
  const cibles = new Set(utilisateurIdsCibles)
  const existantes = await db().featureUtilisateur.findMany({
    where: { featureId },
  })
  const aSupprimer = existantes
    .filter((liaison) => !cibles.has(liaison.utilisateurId))
    .map((liaison) => liaison.utilisateurId)
  if (aSupprimer.length > 0) {
    await db().featureUtilisateur.deleteMany({
      where: { featureId, utilisateurId: { in: aSupprimer } },
    })
  }
  for (const utilisateurId of utilisateurIdsCibles) {
    await db().featureUtilisateur.upsert({
      where: { featureId_utilisateurId: { featureId, utilisateurId } },
      update: {},
      create: { featureId, utilisateurId },
    })
  }
}

const performRemplacer = async (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): Promise<FeatureDetailApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await ensureFeatureExiste(id)
  const utilisateurIds = await resoudreUtilisateurs(body.utilisateurIds)
  await remplacerLiaisons(id, utilisateurIds)
  const row = await db().feature.findUniqueOrThrow({
    where: { id },
    include: featureInclude,
  })
  return toFeatureDetailApiModel(row)
}

export const remplacerUtilisateursAutorises = (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): ResultAsync<FeatureDetailApiModel, never> =>
  ResultAsync.fromSafePromise(performRemplacer(id, body))
