import type {
  AddCollectionIndicateurBody,
  AddCollectionResponsableBody,
  CollectionApiModel,
  CollectionListApiModel,
  CreateCollectionBody,
  UpsertCollectionBody,
} from '@pilote/kpilote-shared/collection'
import {
  collectionApiModelSchema,
  collectionListApiModelSchema,
} from '@pilote/kpilote-shared/collection'
import type { CollectionPermissionsApiModel } from '@pilote/kpilote-shared/permission'
import { collectionPermissionsApiModelSchema } from '@pilote/kpilote-shared/permission'

import { bffClient } from '@/api/client'

export type ListCollectionsParams = {
  recherche?: string | undefined
  rechercheIdentifiant?: string | undefined
  cursor?: string | undefined
}

export const fetchCollections = async (
  params: ListCollectionsParams,
): Promise<CollectionListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.rechercheIdentifiant) searchParams.rechercheIdentifiant = params.rechercheIdentifiant
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('collections', { searchParams }).json()
  return collectionListApiModelSchema.parse(json)
}

export const fetchCollectionById = async (id: string): Promise<CollectionApiModel> => {
  const json = await bffClient.get(`collections/${id}`).json()
  return collectionApiModelSchema.parse(json)
}

export const createCollection = async (body: CreateCollectionBody): Promise<CollectionApiModel> => {
  const json = await bffClient.post('collections', { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const upsertCollection = async (
  id: string,
  body: UpsertCollectionBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.put(`collections/${id}`, { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const deleteCollection = async (id: string): Promise<void> => {
  await bffClient.delete(`collections/${id}`)
}

// --- Indicateurs affectés ----------------------------------------------------

export const addCollectionIndicateur = async (
  id: string,
  body: AddCollectionIndicateurBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.post(`collections/${id}/indicateurs`, { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const updateCollectionIndicateurPonderation = async (
  id: string,
  indicateurId: string,
  ponderation: number,
): Promise<CollectionApiModel> => {
  const json = await bffClient
    .patch(`collections/${id}/indicateurs/${indicateurId}`, { json: { ponderation } })
    .json()
  return collectionApiModelSchema.parse(json)
}

export const removeCollectionIndicateur = async (
  id: string,
  indicateurId: string,
): Promise<void> => {
  await bffClient.delete(`collections/${id}/indicateurs/${indicateurId}`)
}

// --- Responsables ------------------------------------------------------------

export const addCollectionResponsable = async (
  id: string,
  body: AddCollectionResponsableBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.post(`collections/${id}/responsables`, { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const removeCollectionResponsable = async (
  id: string,
  utilisateurId: string,
): Promise<void> => {
  await bffClient.delete(`collections/${id}/responsables/${utilisateurId}`)
}

// --- Accès -------------------------------------------------------------------

export const fetchCollectionPermissions = async (
  id: string,
): Promise<CollectionPermissionsApiModel> => {
  const json = await bffClient.get(`collections/${id}/permissions`).json()
  return collectionPermissionsApiModelSchema.parse(json)
}
