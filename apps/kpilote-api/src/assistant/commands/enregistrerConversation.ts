import { db } from '@/framework/persistence/dbStore'

const LONGUEUR_MAX_TITRE = 80

/** Premier message utilisateur, tronqué. Suffit à retrouver une conversation dans une liste. */
export const deriverTitre = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    const candidat = message as { role?: string; parts?: ReadonlyArray<unknown> }
    if (candidat.role !== 'user') continue
    const texte = (candidat.parts ?? [])
      .filter((part): part is { type: 'text'; text: string } => {
        const courante = part as { type?: string }
        return courante.type === 'text'
      })
      .map((part) => part.text)
      .join(' ')
      .trim()
    if (texte.length === 0) continue
    return texte.length > LONGUEUR_MAX_TITRE ? `${texte.slice(0, LONGUEUR_MAX_TITRE - 1)}…` : texte
  }
  return 'Nouvelle conversation'
}

// Aller-retour JSON explicite : le sérialiseur de Prisma plante sur les schémas zod que le
// SDK attache aux définitions d'outils présentes dans les parts.
const enPlainJson = (valeur: unknown): object => JSON.parse(JSON.stringify(valeur)) as object

export const enregistrerConversation = async ({
  id,
  principalId,
  surface,
  messages,
}: {
  id: string
  principalId: string
  surface: string
  messages: ReadonlyArray<unknown>
}): Promise<void> => {
  const blob = enPlainJson(messages)
  await db().assistantConversation.upsert({
    where: { id },
    create: { id, principalId, surface, titre: deriverTitre(messages), messages: blob },
    update: { messages: blob },
  })
}

export const enregistrerAppel = async ({
  conversationId,
  principalId,
  modele,
  surface,
  transcript,
  inputTokens,
  outputTokens,
  dureeMs,
}: {
  conversationId: string
  principalId: string
  modele: string
  surface: string
  transcript: unknown
  inputTokens: number
  outputTokens: number
  dureeMs: number
}): Promise<void> => {
  await db().assistantAppel.create({
    data: {
      conversationId,
      principalId,
      modele,
      surface,
      transcript: enPlainJson(transcript),
      inputTokens,
      outputTokens,
      dureeMs,
    },
  })
}
