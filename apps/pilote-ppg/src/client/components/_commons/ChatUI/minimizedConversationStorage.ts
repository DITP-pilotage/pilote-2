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

export type MinimizedConversation = z.infer<typeof conversationMinimiseeSchema>;

export const readMinimizedConversation = (): MinimizedConversation | null => {
  const brut = sessionStorage.getItem(CLE);
  if (!brut) return null;

  try {
    const result = conversationMinimiseeSchema.safeParse(JSON.parse(brut));
    if (result.success) return result.data;
  } catch {
    // Unreadable content: treated as if nothing was stored.
  }

  sessionStorage.removeItem(CLE);
  return null;
};

export const writeMinimizedConversation = (
  conversation: MinimizedConversation,
): void => {
  sessionStorage.setItem(CLE, JSON.stringify(conversation));
};

export const clearMinimizedConversation = (): void => {
  sessionStorage.removeItem(CLE);
};
