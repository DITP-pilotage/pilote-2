import {
  type DernieresValeursIndividuListApiModel,
  dernieresValeursIndividuListApiModelSchema,
  type ListDernieresValeursForIndividuQuery,
  type ListTauxProgressionIndividuQuery,
  type TauxProgressionIndividuListApiModel,
  tauxProgressionIndividuListApiModelSchema,
} from '@pilote/kpilot-shared/valeurAvancement'

import { apiClient } from '@/api/client'

export const fetchDernieresValeursForIndividu = async (
  individuId: string,
  params: ListDernieresValeursForIndividuQuery,
): Promise<DernieresValeursIndividuListApiModel> => {
  const json = await apiClient
    .get(`individus/${individuId}/dernieres-valeurs`, {
      searchParams: { indicateurs: params.indicateurs.join(',') },
    })
    .json()
  return dernieresValeursIndividuListApiModelSchema.parse(json)
}

export const fetchTauxProgressionForIndividu = async (
  individuId: string,
  params: ListTauxProgressionIndividuQuery,
): Promise<TauxProgressionIndividuListApiModel> => {
  const json = await apiClient
    .get(`individus/${individuId}/taux-progression`, {
      searchParams: { indicateurs: params.indicateurs.join(',') },
    })
    .json()
  return tauxProgressionIndividuListApiModelSchema.parse(json)
}
