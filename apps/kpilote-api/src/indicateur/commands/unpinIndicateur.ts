import { ResultAsync } from 'neverthrow'

import { requireUser } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

type UnpinIndicateurParams = { publicId: string }

// Sans contrôle de lecture : on retire une épingle même d'un indicateur devenu
// illisible. Un indicateur inconnu ou non épinglé ne change rien, sans erreur,
// ce qui ne dit pas non plus si un indicateur privé existe.
const performUnpin = async ({ publicId }: UnpinIndicateurParams): Promise<void> => {
  const { id: utilisateurId } = requireUser()
  await db().indicateurEpingle.deleteMany({ where: { utilisateurId, indicateur: { publicId } } })
}

export const unpinIndicateur = (params: UnpinIndicateurParams): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performUnpin(params))
