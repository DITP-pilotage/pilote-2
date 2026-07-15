import {
  type FeatureFlippingApiModel,
  type FeatureFlippingDetailApiModel,
} from '@pilote/kpilote-shared/featureFlipping'
import { type UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'

import { type Prisma } from '@/generated/prisma/client'

export const featureFlippingInclude = {
  utilisateursAutorises: { include: { utilisateur: true } },
} satisfies Prisma.FeatureFlippingInclude

export type FeatureFlippingRow = Prisma.FeatureFlippingGetPayload<{
  include: typeof featureFlippingInclude
}>

const toUtilisateurApiModel = (
  utilisateur: FeatureFlippingRow['utilisateursAutorises'][number]['utilisateur'],
): UtilisateurApiModel => ({
  id: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  service: utilisateur.service,
  fonction: utilisateur.fonction,
  // Statut/providers non nécessaires ici : la fiche n'affiche que nom/prénom/email.
  status: 'actif',
  providers: [],
  createdAt: utilisateur.createdAt.toISOString(),
  updatedAt: utilisateur.updatedAt.toISOString(),
})

export const toFeatureFlippingApiModel = (
  row: Pick<FeatureFlippingRow, 'id' | 'key' | 'nom' | 'etat'>,
): FeatureFlippingApiModel => ({
  id: row.id,
  key: row.key,
  nom: row.nom,
  etat: row.etat,
})

export const toFeatureFlippingDetailApiModel = (
  row: FeatureFlippingRow,
): FeatureFlippingDetailApiModel => ({
  ...toFeatureFlippingApiModel(row),
  utilisateursAutorises: row.utilisateursAutorises
    .map((liaison) => toUtilisateurApiModel(liaison.utilisateur))
    .sort((a, b) => a.email.localeCompare(b.email)),
})
