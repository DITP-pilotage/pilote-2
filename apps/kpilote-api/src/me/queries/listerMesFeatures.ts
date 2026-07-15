import { type MeFeatureApiModel } from '@pilote/kpilote-shared/meFeature'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const loadFeaturesActives = async (utilisateurId: string | null): Promise<string[]> => {
  const rows = await db().feature.findMany({
    where: {
      OR: [
        { etat: 'ACTIVE' },
        ...(utilisateurId
          ? [
              {
                etat: 'ACTIVE_POUR_UTILISATEUR' as const,
                utilisateursAutorises: { some: { utilisateurId } },
              },
            ]
          : []),
      ],
    },
    select: { key: true },
    orderBy: { key: 'asc' },
  })
  return rows.map((row) => row.key)
}

export const listerMesFeatures = (): ResultAsync<MeFeatureApiModel, never> => {
  // Une API key ADMIN n'est pas un utilisateur ciblable : elle ne voit que les FF ACTIVE.
  const utilisateurId = isAdminPrincipal() ? null : requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(loadFeaturesActives(utilisateurId)).map((features) => ({
    features,
  }))
}
