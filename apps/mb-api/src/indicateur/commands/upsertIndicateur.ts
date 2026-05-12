import { type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export const upsertIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    (async () => {
      const principalId = requireCurrentPrincipalId()
      const existing = await db().indicateur.findUnique({
        where: { publicId },
        select: { id: true },
      })

      if (existing) {
        const hasWrite = await db().indicateurPermission.findUnique({
          where: {
            principalId_indicateurId_action: {
              principalId,
              indicateurId: existing.id,
              action: 'WRITE',
            },
          },
          select: { action: true },
        })
        if (!hasWrite) {
          throw new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")
        }
        await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
        return
      }

      const id = uuidv7()
      await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
      await db().indicateurPermission.createMany({
        data: [
          { principalId, indicateurId: id, action: 'READ' },
          { principalId, indicateurId: id, action: 'WRITE' },
        ],
      })
    })(),
  )
