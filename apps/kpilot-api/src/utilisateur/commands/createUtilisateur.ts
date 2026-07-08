import { type CreateUtilisateurBody, type UtilisateurApiModel } from '@pilote/kpilot-shared/utilisateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performCreate = async (body: CreateUtilisateurBody): Promise<UtilisateurApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  const id = uuidv7()
  await db().principal.create({ data: { id } })
  const created = await db().utilisateur.create({
    data: {
      id,
      email: body.email,
      nom: body.nom,
      prenom: body.prenom,
      service: body.service,
      fonction: body.fonction,
    },
    include: { identites: true },
  })
  return toUtilisateurApiModel(created)
}

export const createUtilisateur = (
  body: CreateUtilisateurBody,
): ResultAsync<UtilisateurApiModel, never> => ResultAsync.fromSafePromise(performCreate(body))
