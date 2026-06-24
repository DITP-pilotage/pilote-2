import {
  niveauConfianceApiModelSchema,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/niveauConfiance'

import { erreursEntite } from '@/framework/openapi/responses'

export const NiveauConfianceApiModelSchema =
  niveauConfianceApiModelSchema.openapi('NiveauConfianceApiModel')
export const NiveauConfianceListApiModelSchema = niveauConfianceListApiModelSchema.openapi(
  'NiveauConfianceListApiModel',
)

export const reponseNiveauConfiance = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceApiModelSchema } },
    description: 'Niveau de confiance',
  },
  ...erreursEntite,
}

export const reponseHistoriqueNiveauConfiance = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceListApiModelSchema } },
    description: 'Historique paginé',
  },
}
