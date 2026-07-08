import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

const loadIndicateur = async (where: Prisma.IndicateurWhereInput): Promise<IndicateurApiModel> => {
  const indicateur = await db().indicateur.findFirstOrThrow({
    where,
    include: {
      referentiels: { include: { referentiel: true } },
      responsables: {
        orderBy: { createdAt: 'asc' },
        include: { utilisateur: true },
      },
    },
  })
  // La date est stockée en `YYYY-MM-DD` : le MAX lexicographique = MAX chronologique.
  const { _max } = await db().valeurAvancement.aggregate({
    where: { indicateurId: indicateur.id },
    _max: { date: true },
  })
  return toIndicateurApiModel({ indicateur, dateDerniereValeur: _max.date })
}

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  // Le bypass ADMIN est géré dans withIndicateurReadPermission. Sans lui, un ADMIN
  // listerait un indicateur PRIVÉ mais obtiendrait un 404 sur le détail (incohérence
  // liste ↔ détail).
  const where = withIndicateurReadPermission({ publicId }, principalId, {
    isAdmin: isAdminPrincipal(),
  })
  return ResultAsync.fromSafePromise(loadIndicateur(where))
}
