import { z } from 'zod'

import { utilisateurApiModelSchema } from './utilisateur'

export const featureFlippingEtatSchema = z
  .enum(['ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE'])
  .describe(
    'État du feature flipping : `ACTIVE` (tous), `ACTIVE_POUR_UTILISATEUR` (utilisateurs autorisés uniquement), `DESACTIVE` (personne).',
  )
export type FeatureFlippingEtat = z.infer<typeof featureFlippingEtatSchema>

export const featureFlippingKeySchema = z
  .string()
  .regex(/^[a-z0-9_-]+$/, 'La clé doit être en minuscules (a-z, 0-9, `_`, `-`).')
  .describe('Clé technique référencée dans le code (ex. `nouveau_dashboard`).')

export const featureFlippingApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du feature flipping.'),
    key: featureFlippingKeySchema,
    nom: z.string().describe('Libellé lisible.'),
    etat: featureFlippingEtatSchema,
  })
  .describe('Feature flipping (item de liste).')
export type FeatureFlippingApiModel = z.infer<typeof featureFlippingApiModelSchema>

export const featureFlippingListApiModelSchema = z.array(featureFlippingApiModelSchema)
export type FeatureFlippingListApiModel = z.infer<typeof featureFlippingListApiModelSchema>

export const featureFlippingDetailApiModelSchema = featureFlippingApiModelSchema
  .extend({
    utilisateursAutorises: z
      .array(utilisateurApiModelSchema)
      .describe(
        'Utilisateurs autorisés (effectifs uniquement dans l’état ACTIVE_POUR_UTILISATEUR).',
      ),
  })
  .describe('Feature flipping détaillé (fiche).')
export type FeatureFlippingDetailApiModel = z.infer<typeof featureFlippingDetailApiModelSchema>

export const modifierEtatFeatureFlippingBodySchema = z
  .object({ etat: featureFlippingEtatSchema })
  .describe('Changement d’état d’un feature flipping.')
export type ModifierEtatFeatureFlippingBody = z.infer<typeof modifierEtatFeatureFlippingBodySchema>

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
