import {
  niveauConfianceApiModelSchema,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/niveauConfiance'

import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'

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
  400: erreur400,
  403: erreur403,
  404: erreur404,
}

export const reponseHistoriqueNiveauConfiance = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceListApiModelSchema } },
    description: 'Historique paginé',
  },
}
