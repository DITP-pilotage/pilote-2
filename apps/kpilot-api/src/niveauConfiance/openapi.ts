import {
  niveauConfianceApiModelSchema,
  niveauConfianceListApiModelSchema,
} from '@pilote/kpilot-shared/niveauConfiance'

import { erreur400, erreur403, erreur404, succes200 } from '@/framework/openapi/responses'

export const NiveauConfianceApiModelSchema =
  niveauConfianceApiModelSchema.openapi('NiveauConfianceApiModel')
export const NiveauConfianceListApiModelSchema = niveauConfianceListApiModelSchema.openapi(
  'NiveauConfianceListApiModel',
)

export const reponseNiveauConfiance = {
  200: succes200('Niveau de confiance', NiveauConfianceApiModelSchema),
  400: erreur400,
  403: erreur403,
  404: erreur404,
}

export const reponseListeNiveauxConfiance = {
  200: succes200(
    'Niveaux de confiance des commentaires demandés',
    NiveauConfianceListApiModelSchema,
  ),
}
