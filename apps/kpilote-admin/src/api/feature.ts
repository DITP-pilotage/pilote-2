import type {
  FeatureDetailApiModel,
  FeatureEtat,
  FeatureListApiModel,
} from '@pilote/kpilote-shared/feature'
import {
  featureDetailApiModelSchema,
  featureListApiModelSchema,
} from '@pilote/kpilote-shared/feature'

import { bffClient } from '@/api/client'

export const fetchFeatures = async (): Promise<FeatureListApiModel> => {
  const json = await bffClient.get('features').json()
  return featureListApiModelSchema.parse(json)
}

export const fetchFeatureById = async (id: string): Promise<FeatureDetailApiModel> => {
  const json = await bffClient.get(`features/${id}`).json()
  return featureDetailApiModelSchema.parse(json)
}

export const modifierEtatFeature = async (
  id: string,
  etat: FeatureEtat,
): Promise<FeatureDetailApiModel> => {
  const json = await bffClient.patch(`features/${id}/etat`, { json: { etat } }).json()
  return featureDetailApiModelSchema.parse(json)
}

export const remplacerUtilisateursAutorises = async (
  id: string,
  utilisateurIds: string[],
): Promise<FeatureDetailApiModel> => {
  const json = await bffClient
    .put(`features/${id}/utilisateurs`, { json: { utilisateurIds } })
    .json()
  return featureDetailApiModelSchema.parse(json)
}
