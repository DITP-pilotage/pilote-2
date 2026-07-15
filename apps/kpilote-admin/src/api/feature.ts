import type {
  FeatureFlippingDetailApiModel,
  FeatureFlippingEtat,
  FeatureFlippingListApiModel,
} from '@pilote/kpilote-shared/featureFlipping'
import {
  featureFlippingDetailApiModelSchema,
  featureFlippingListApiModelSchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { bffClient } from '@/api/client'

export const fetchFeatureFlippings = async (): Promise<FeatureFlippingListApiModel> => {
  const json = await bffClient.get('feature-flipping').json()
  return featureFlippingListApiModelSchema.parse(json)
}

export const fetchFeatureFlippingById = async (
  id: string,
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient.get(`feature-flipping/${id}`).json()
  return featureFlippingDetailApiModelSchema.parse(json)
}

export const modifierEtatFeatureFlipping = async (
  id: string,
  etat: FeatureFlippingEtat,
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient.patch(`feature-flipping/${id}/etat`, { json: { etat } }).json()
  return featureFlippingDetailApiModelSchema.parse(json)
}

export const remplacerUtilisateursAutorises = async (
  id: string,
  utilisateurIds: string[],
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient
    .put(`feature-flipping/${id}/utilisateurs`, { json: { utilisateurIds } })
    .json()
  return featureFlippingDetailApiModelSchema.parse(json)
}
