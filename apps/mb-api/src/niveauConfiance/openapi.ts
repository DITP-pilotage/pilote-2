import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  niveauConfianceApiModelSchema,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/niveauConfiance'

export const NiveauConfianceApiModelSchema =
  niveauConfianceApiModelSchema.openapi('NiveauConfianceApiModel')
export const NiveauConfianceListApiModelSchema = niveauConfianceListApiModelSchema.openapi(
  'NiveauConfianceListApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const reponseNiveauConfiance = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceApiModelSchema } },
    description: 'Niveau de confiance',
  },
  400: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Requête invalide',
  },
  403: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Permission insuffisante',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Introuvable',
  },
}

export const reponseHistoriqueNiveauConfiance = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceListApiModelSchema } },
    description: 'Historique paginé',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Introuvable',
  },
}
