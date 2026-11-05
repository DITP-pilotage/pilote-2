import { type AssistantAcces } from '@pilote/kpilote-shared/assistant/admin'

import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

export const readAcces = async (): Promise<AssistantAcces> => {
  const [parametres, acces] = await Promise.all([
    db().assistantParametres.findUnique({ where: { id: 1 } }),
    db().assistantAccesUtilisateur.findMany({
      include: { utilisateur: { include: { identites: true } } },
      orderBy: { utilisateur: { email: 'asc' } },
    }),
  ])
  return {
    actif: parametres?.actif === true,
    utilisateurs: acces.map((row) => toUtilisateurApiModel(row.utilisateur)),
  }
}

export const setActif = async (actif: boolean): Promise<AssistantAcces> => {
  await db().assistantParametres.upsert({
    where: { id: 1 },
    update: { actif },
    create: { id: 1, actif },
  })
  return readAcces()
}

export const autoriserUtilisateur = async (utilisateurId: string): Promise<AssistantAcces> => {
  const utilisateur = await db().utilisateur.findUnique({
    where: { id: utilisateurId },
    select: { id: true },
  })
  if (!utilisateur) throw new NotFoundError('Aucun utilisateur kpilote ne correspond.')
  await db().assistantAccesUtilisateur.upsert({
    where: { utilisateurId },
    update: {},
    create: { utilisateurId },
  })
  return readAcces()
}

export const retirerUtilisateur = async (utilisateurId: string): Promise<AssistantAcces> => {
  await db().assistantAccesUtilisateur.deleteMany({ where: { utilisateurId } })
  return readAcces()
}
