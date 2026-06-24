import { type ResultAsync } from 'neverthrow'

import { type Prisma } from '@/generated/prisma/client'

// Fragment `data` du satellite à greffer sur la création d'un Commentaire.
type SatelliteCreate = Pick<
  Prisma.CommentaireCreateInput,
  'indicateurIndividu' | 'panierIndividu' | 'panier'
>

// Données nécessaires pour rattacher un nouveau commentaire à son satellite.
type CibleEcriture = {
  principalId: string
  satelliteCreate: (type: string) => SatelliteCreate
}

// Contrat des configs colocalisées avec les use cases de chaque domaine
// (cf. indicateur/commands/creer*, panier/commands/creer*).
export type SujetCommentaireConfig<P extends Record<string, string> = Record<string, string>> = {
  // Résout le path en ids internes + vérifie la permission WRITE ; throw ForbiddenError/404 sinon.
  resoudreCibleEcriture: (params: P) => ResultAsync<CibleEcriture, never>
  // Construit le `where` Prisma sur Commentaire pour le listing (READ permission + scope).
  whereLecture: (params: P, principalId: string) => Prisma.CommentaireWhereInput
}
