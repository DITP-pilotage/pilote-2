import type { PanierListApiModel } from '@pilote/mb-shared/panier'
import { panierListApiModelSchema } from '@pilote/mb-shared/panier'

import { bffClient } from '@/api/client'

export type ListPaniersParams = { recherche?: string | undefined; cursor?: string | undefined }

export const fetchPaniers = async (params: ListPaniersParams): Promise<PanierListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('paniers', { searchParams }).json()
  return panierListApiModelSchema.parse(json)
}
