import { type CreateUtilisateurBody, type UtilisateurApiModel } from '@pilote/mb-shared/utilisateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performCreate = async (body: CreateUtilisateurBody): Promise<UtilisateurApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  // Anti-collision : `email` est unique en base — on préempte le 409 avec un
  // message lisible plutôt que laisser remonter une PrismaClientKnownRequestError.
  const conflict = await db().utilisateur.findUnique({ where: { email: body.email } })
  if (conflict) throw new ConflictError('Un utilisateur avec cet email existe déjà')

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
