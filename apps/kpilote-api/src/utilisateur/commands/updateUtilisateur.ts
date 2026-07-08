import { type UpdateUtilisateurBody, type UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performUpdate = async (
  id: string,
  body: UpdateUtilisateurBody,
): Promise<UtilisateurApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  // 404 : `findUniqueOrThrow` lève P2025 mappé en 404 par le ErrorHandler global.
  await db().utilisateur.findUniqueOrThrow({ where: { id } })

  const updated = await db().utilisateur.update({
    where: { id },
    data: {
      nom: body.nom,
      prenom: body.prenom,
      service: body.service,
      fonction: body.fonction,
    },
    include: { identites: true },
  })
  return toUtilisateurApiModel(updated)
}

export const updateUtilisateur = (
  id: string,
  body: UpdateUtilisateurBody,
): ResultAsync<UtilisateurApiModel, never> => ResultAsync.fromSafePromise(performUpdate(id, body))
