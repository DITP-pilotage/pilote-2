import {
  type ListDossiersQuery,
  type DossierApiModel,
  dossierApiModelSchema,
  type DossierListApiModel,
  dossierListApiModelSchema,
} from '@pilote/kpilote-shared/dossier'
import {
  type DossierTauxProgressionApiModel,
  dossierTauxProgressionApiModelSchema,
  type DossierTauxProgressionSummaryListApiModel,
  dossierTauxProgressionSummaryListApiModelSchema,
} from '@pilote/kpilote-shared/dossierTauxProgression'

import { apiClient } from '@/api/client'

export const fetchDossiers = async (params: ListDossiersQuery): Promise<DossierListApiModel> => {
  const json = await apiClient.get('dossiers', { searchParams: params }).json()
  return dossierListApiModelSchema.parse(json)
}

export const fetchDossierById = async (id: string): Promise<DossierApiModel> => {
  const json = await apiClient.get(`dossiers/${id}`).json()
  return dossierApiModelSchema.parse(json)
}

export const fetchDossierTauxProgression = async ({
  dossierId,
  individu,
}: {
  dossierId: string
  individu: string
}): Promise<DossierTauxProgressionApiModel> => {
  const json = await apiClient
    .get(`dossiers/${dossierId}/taux-progression`, { searchParams: { individu } })
    .json()
  return dossierTauxProgressionApiModelSchema.parse(json)
}

export const fetchDossierTauxProgressionForIndividu = async (
  individuId: string,
  dossierIds: string[],
): Promise<DossierTauxProgressionSummaryListApiModel> => {
  const json = await apiClient
    .get(`individus/${individuId}/taux-progression/dossiers`, {
      searchParams: { dossiers: dossierIds.join(',') },
    })
    .json()
  return dossierTauxProgressionSummaryListApiModelSchema.parse(json)
}
