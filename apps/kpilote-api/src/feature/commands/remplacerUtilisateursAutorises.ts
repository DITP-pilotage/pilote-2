import {
  type FeatureDetailApiModel,
  type RemplacerUtilisateursAutorisesBody,
} from '@pilote/kpilote-shared/feature'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
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

const resoudreUtilisateurs = async (
  utilisateurIds: ReadonlyArray<string>,
): Promise<{ resolus: string[]; inconnus: string[] }> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return { resolus: [], inconnus: [] }
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  return { resolus: idsUniques, inconnus: idsUniques.filter((id) => !idsTrouves.has(id)).sort() }
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
): Promise<Result<FeatureDetailApiModel, RemplacerUtilisateursAutorisesError>> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await ensureFeatureExiste(id)
  const utilisateurs = await resoudreUtilisateurs(body.utilisateurIds)
  if (utilisateurs.inconnus.length > 0) {
    return err({ type: 'UTILISATEURS_INCONNUS', utilisateurs: utilisateurs.inconnus })
  }
  await remplacerLiaisons(id, utilisateurs.resolus)
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
