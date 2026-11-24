import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

// Une feature ACTIVE l'est pour tous ; ACTIVE_POUR_UTILISATEUR seulement pour les utilisateurs
// autorisés. Sans utilisateur (`null`), seules les features ACTIVE comptent.
export const featureActiveWhere = (utilisateurId: string | null): Prisma.FeatureWhereInput => ({
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
})

// Une clé API ADMIN n'est pas un utilisateur ciblable : elle ne voit que les features ACTIVE.
const currentUtilisateurCiblable = (): string | null =>
  isAdminPrincipal() ? null : requireCurrentPrincipalId()

export const loadFeaturesActives = async (): Promise<string[]> => {
  const rows = await db().feature.findMany({
    where: featureActiveWhere(currentUtilisateurCiblable()),
    select: { key: true },
    orderBy: { key: 'asc' },
  })
  return rows.map((row) => row.key)
}

export const isFeatureActive = async (key: string): Promise<boolean> => {
  const count = await db().feature.count({
    where: { key, ...featureActiveWhere(currentUtilisateurCiblable()) },
  })
  return count > 0
}
