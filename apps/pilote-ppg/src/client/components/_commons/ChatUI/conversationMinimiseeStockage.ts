import { z } from "zod";

const CLE = "albert:conversation";

const conversationMinimiseeSchema = z.object({
  id: z.string().uuid(),
  agentContext: z.object({
    territoireCode: z.string(),
    jalon: z.number(),
    instructions: z.string(),
  }),
});

export type ConversationMinimisee = z.infer<typeof conversationMinimiseeSchema>;

export const lireConversationMinimisee = (): ConversationMinimisee | null => {
  const brut = sessionStorage.getItem(CLE);
  if (!brut) return null;

  try {
    const resultat = conversationMinimiseeSchema.safeParse(JSON.parse(brut));
    if (resultat.success) return resultat.data;
  } catch {
    // Contenu illisible : traité comme une absence.
  }

  sessionStorage.removeItem(CLE);
  return null;
};

export const ecrireConversationMinimisee = (
  conversation: ConversationMinimisee,
): void => {
  sessionStorage.setItem(CLE, JSON.stringify(conversation));
};

export const effacerConversationMinimisee = (): void => {
  sessionStorage.removeItem(CLE);
};
