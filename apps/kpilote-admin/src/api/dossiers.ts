import type { DossierListApiModel } from '@pilote/kpilote-shared/dossier'
import { dossierListApiModelSchema } from '@pilote/kpilote-shared/dossier'

import { bffClient } from '@/api/client'

export type ListDossiersParams = {
  recherche?: string | undefined
  rechercheIdentifiant?: string | undefined
  cursor?: string | undefined
}

export const fetchDossiers = async (params: ListDossiersParams): Promise<DossierListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.rechercheIdentifiant) searchParams.rechercheIdentifiant = params.rechercheIdentifiant
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('dossiers', { searchParams }).json()
  return dossierListApiModelSchema.parse(json)
}
