import { type FeatureApiModel, type FeatureDetailApiModel } from '@pilote/kpilote-shared/feature'

import { type Prisma } from '@/generated/prisma/client'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

export const featureInclude = {
  utilisateursAutorises: { include: { utilisateur: { include: { identites: true } } } },
} satisfies Prisma.FeatureInclude

export type FeatureRow = Prisma.FeatureGetPayload<{
  include: typeof featureInclude
}>

export const toFeatureApiModel = (
  row: Pick<FeatureRow, 'id' | 'key' | 'nom' | 'etat'>,
): FeatureApiModel => ({
  id: row.id,
  key: row.key,
  nom: row.nom,
  etat: row.etat,
})

export const toFeatureDetailApiModel = (row: FeatureRow): FeatureDetailApiModel => ({
  ...toFeatureApiModel(row),
  utilisateursAutorises: row.utilisateursAutorises
    .map((liaison) => toUtilisateurApiModel(liaison.utilisateur))
    .sort((a, b) => a.email.localeCompare(b.email)),
})
