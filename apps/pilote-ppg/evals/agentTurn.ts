import { randomUUID } from "node:crypto";
import { AssistantIA } from "@/server/albert/AssistantIA";
import type { EvalWorld } from "./world";

/**
 * Un tour d'agent, joué par le même code que la route de production.
 *
 * Il n'y a volontairement rien ici qui construise des tools ou un prompt :
 * tout le câblage vit dans `AssistantIA`. Ce fichier ne fait que traduire le
 * résultat en ce que les scorers savent lire.
 */

export type ObservedToolCall = { toolName: string; input?: unknown };

export type AgentTurn = {
  toolCalls: ObservedToolCall[];
  text: string;
  stepCount: number;
};

export async function runAgentTurn({
  question,
  world,
  model,
}: {
  question: string;
  world: EvalWorld;
  model?: string;
}): Promise<AgentTurn> {
  const result = await AssistantIA.generateText({
    // Comme en production : chaque tour est une conversation, tracée dans
    // `llm_calls`. L'écriture part avec la transaction.
    chatId: randomUUID(),
    question,
    habilitations: world.habilitations,
    agentContext: undefined,
    userId: world.userId,
    model,
  });

  return {
    toolCalls: result.steps.flatMap((step) =>
      step.toolCalls.map((call) => ({
        toolName: call.toolName,
        input: call.input,
      })),
    ),
    text: result.text,
    stepCount: result.steps.length,
  };
}
