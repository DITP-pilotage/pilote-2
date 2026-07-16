import { z } from 'zod'

import { utilisateurApiModelSchema } from './utilisateur'

export const featureEtatSchema = z
  .enum(['ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE'])
  .describe(
    'État de la feature : `ACTIVE` (tous), `ACTIVE_POUR_UTILISATEUR` (utilisateurs autorisés uniquement), `DESACTIVE` (personne).',
  )
export type FeatureEtat = z.infer<typeof featureEtatSchema>

export const featureKeySchema = z
  .string()
  .regex(/^[A-Z_]+$/, 'La clé doit être en majuscules (A-Z et `_` uniquement).')
  .describe('Clé technique référencée dans le code (ex. `NOUVEAU_DASHBOARD`).')

export const featureApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du feature flipping.'),
    key: featureKeySchema,
    nom: z.string().describe('Libellé lisible.'),
    etat: featureEtatSchema,
  })
  .describe('Feature flipping (item de liste).')
export type FeatureApiModel = z.infer<typeof featureApiModelSchema>

export const featureListApiModelSchema = z.array(featureApiModelSchema)
export type FeatureListApiModel = z.infer<typeof featureListApiModelSchema>

export const featureDetailApiModelSchema = featureApiModelSchema
  .extend({
    utilisateursAutorises: z
      .array(utilisateurApiModelSchema)
      .describe(
        'Utilisateurs autorisés (effectifs uniquement dans l’état ACTIVE_POUR_UTILISATEUR).',
      ),
  })
  .describe('Feature flipping détaillé (fiche).')
export type FeatureDetailApiModel = z.infer<typeof featureDetailApiModelSchema>

export const modifierEtatFeatureBodySchema = z
  .object({ etat: featureEtatSchema })
  .describe('Changement d’état d’un feature flipping.')
export type ModifierEtatFeatureBody = z.infer<typeof modifierEtatFeatureBodySchema>

export const remplacerUtilisateursAutorisesBodySchema = z
  .object({
    utilisateurIds: z
      .array(z.string().uuid())
      .describe('Liste complète des utilisateurs autorisés (remplace l’existant).'),
  })
  .describe('Remplacement de la liste des utilisateurs autorisés.')
export type RemplacerUtilisateursAutorisesBody = z.infer<
  typeof remplacerUtilisateursAutorisesBodySchema
>
