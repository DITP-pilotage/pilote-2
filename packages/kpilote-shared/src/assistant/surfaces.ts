import { z } from 'zod'

import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

// Une surface est un point d'entrée de l'assistant. L'appelant la DÉCLARE : le moteur ne
// déduit jamais l'intention du texte.
//
// Surfaces à venir, chacune consommant `contexteEntiteSchema` ci-dessous. Les ajouter ici
// fait échouer la compilation de `PROMPTS_SURFACE` côté API tant qu'elles n'ont pas leur
// couche de prompt : le compilateur tient la liste de ce qui reste à faire.
//
// - 'ask-entite'    question portant sur une entité désignée dans la palette de commandes.
//                   Le focus est LE sujet : l'assistant n'en sort pas sans y être invité.
// - 'ask-page'      question posée depuis une page. Le focus est le sujet PAR DÉFAUT, mais
//                   la question peut porter ailleurs.
// - 'synthese-page' synthèse de la page courante. La question est pré-remplie par le front
//                   et envoyée comme message utilisateur : même endpoint, même transport,
//                   et la synthèse devient le premier tour d'une conversation qu'on peut
//                   poursuivre plutôt qu'un cul-de-sac.
export const SURFACES = ['ask-libre'] as const
export type Surface = (typeof SURFACES)[number]

/** Liste fermée : une surcharge de modèle ne doit pas pouvoir pointer hors d'Albert. */
export const MODELES = ['openweight-large', 'openweight-medium'] as const
export type Modele = (typeof MODELES)[number]

const referenceEntiteSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('indicateur'), publicId: indicateurPublicIdSchema }),
  z.object({ type: z.literal('collection'), publicId: collectionPublicIdSchema }),
  z.object({ type: z.literal('individu'), publicId: individuPublicIdSchema }),
  z.object({ type: z.literal('referentiel'), publicId: referentielPublicIdSchema }),
])

export type ReferenceEntite = z.infer<typeof referenceEntiteSchema>

/**
 * Le contexte qu'une surface fournit au moteur.
 *
 * `focus` est le sujet, `cadrage` les entités qui le restreignent. Une page peut porter une
 * collection VUE POUR un individu : focus = collection, cadrage = [individu]. Un contexte
 * mono-entité ne sait pas l'exprimer, d'où cette forme — validée maintenant pour ne pas
 * renégocier le contrat quand la deuxième surface arrivera.
 */
export const contexteEntiteSchema = z.object({
  focus: referenceEntiteSchema,
  cadrage: z.array(referenceEntiteSchema).max(4).default([]),
})

export type ContexteEntite = z.infer<typeof contexteEntiteSchema>

export const chatRequestSchema = z.discriminatedUnion('surface', [
  z.object({
    surface: z.literal('ask-libre'),
    conversationId: z.uuid().describe('Identifiant de la conversation, généré par le client.'),
    messages: z.array(z.unknown()).describe('Historique au format UIMessage du SDK ai.'),
    modele: z
      .enum(MODELES)
      .optional()
      .describe('Surcharge du modèle. Sert à rejouer un même échange sur deux modèles.'),
  }),
])

export type ChatRequest = z.infer<typeof chatRequestSchema>
