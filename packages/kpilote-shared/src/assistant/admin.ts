import { z } from 'zod'

import { utilisateurApiModelSchema } from '../utilisateur'
import { ISSUE_CATEGORIES } from './feedback'

export const ADMIN_PAGE_SIZE = 25

export const assistantAccesSchema = z.object({
  actif: z.boolean().describe('Interrupteur général : coupé, personne n’a accès.'),
  utilisateurs: z
    .array(utilisateurApiModelSchema)
    .describe('Utilisateurs autorisés quand l’assistant est actif, triés par e-mail.'),
})
export type AssistantAcces = z.infer<typeof assistantAccesSchema>

export const setActifBodySchema = z.object({ actif: z.boolean() })

const flag = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional()

export const adminConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  recherche: z.string().trim().max(200).optional().describe('Recherche dans le titre.'),
  positif: flag.describe('Seulement les conversations avec une évaluation positive.'),
  negatif: flag.describe('Seulement les conversations avec une évaluation négative.'),
  commentaire: flag.describe('Seulement les conversations avec un commentaire.'),
  categorie: z.enum(ISSUE_CATEGORIES).optional().describe('Catégorie de problème signalée.'),
})
export type AdminConversationsQuery = z.input<typeof adminConversationsQuerySchema>

// Pseudonymisé : ni nom, ni e-mail, ni identifiant de l'auteur.
export const adminConversationSummarySchema = z.object({
  id: z.uuid(),
  titre: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  reponses: z
    .number()
    .int()
    .describe('Nombre de réponses produites, y compris celles remplacées par une relance.'),
  positifs: z.number().int(),
  negatifs: z.number().int(),
  commentaires: z.number().int(),
})
export type AdminConversationSummary = z.infer<typeof adminConversationSummarySchema>

export const adminConversationListSchema = z.object({
  items: z.array(adminConversationSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  taillePage: z.number().int(),
})
export type AdminConversationList = z.infer<typeof adminConversationListSchema>

export const adminAppelSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  modele: z.string(),
  evaluation: z.enum(['POSITIVE', 'NEGATIVE']).nullable(),
  categories: z.array(z.enum(ISSUE_CATEGORIES)),
  commentaire: z.string().nullable(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  dureeMs: z.number().int(),
})
export type AdminAppel = z.infer<typeof adminAppelSchema>

export const adminConversationSchema = z.object({
  id: z.uuid(),
  titre: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  messages: z.array(z.unknown()).describe('Les messages, au format UIMessage du SDK `ai`.'),
  appels: z.array(adminAppelSchema).describe('Un appel par réponse, dans l’ordre.'),
})
export type AdminConversation = z.infer<typeof adminConversationSchema>
