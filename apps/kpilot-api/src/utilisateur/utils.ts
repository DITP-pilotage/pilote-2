import { type UtilisateurApiModel } from '@pilote/kpilot-shared/utilisateur'

import { fromDate } from '@/framework/date'
import { ProviderType } from '@/generated/prisma/enums'
import { type IdentiteExterneModel, type UtilisateurModel } from '@/generated/prisma/models'

const PROVIDER_ORDER: ProviderType[] = [ProviderType.proconnect, ProviderType.keycloak]

type UtilisateurWithIdentites = UtilisateurModel & { identites: IdentiteExterneModel[] }

export const toUtilisateurApiModel = (row: UtilisateurWithIdentites): UtilisateurApiModel => {
  const providersSet = new Set(row.identites.map((i) => i.provider))
  const providers = PROVIDER_ORDER.filter((p) => providersSet.has(p))
  return {
    id: row.id,
    email: row.email,
    nom: row.nom,
    prenom: row.prenom,
    service: row.service,
    fonction: row.fonction,
    status: providers.length === 0 ? 'en_attente' : 'actif',
    providers,
    createdAt: fromDate(row.createdAt).toString(),
    updatedAt: fromDate(row.updatedAt).toString(),
  }
}
