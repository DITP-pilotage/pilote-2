import { z } from 'zod'

/** Liste fermée : une surcharge de modèle ne doit pas pouvoir pointer hors d'Albert. */
export const MODELS = ['openweight-large', 'openweight-medium'] as const
export type Model = (typeof MODELS)[number]

export const MAX_MESSAGE_LENGTH = 4000

const boundedId = z.string().min(1).max(128)

// Le serveur possède l'historique : le client n'envoie que le nouveau message, et ce
// message ne peut être qu'une question de l'utilisateur. Un rôle `system` ou une part
// d'outil forgée serait sinon persistée et rejouée au modèle.
export const userMessageSchema = z
  .object({
    id: boundedId,
    role: z.literal('user'),
    parts: z
      .array(
        z
          .object({ type: z.literal('text'), text: z.string().min(1).max(MAX_MESSAGE_LENGTH) })
          .strict(),
      )
      .length(1),
  })
  .strict()

export const pageContextSchema = z
  .object({
    indicateurId: boundedId.optional(),
    collectionId: boundedId.optional(),
    individuId: boundedId.optional(),
  })
  .strict()
  .describe("Entités affichées par la page d'où la question est posée.")

export type PageContext = z.infer<typeof pageContextSchema>

export const chatRequestSchema = z.object({
  id: z.uuid().describe('Identifiant de la conversation, généré par le client.'),
  message: userMessageSchema,
  model: z.enum(MODELS).optional(),
  context: pageContextSchema.optional(),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>
