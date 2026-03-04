import { createOpenAI } from "@ai-sdk/openai";
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  stepCountIs,
  tool,
  ToolSet,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";
import { SYNTHESE_TERRITOIRE_OUTPUT_FORMAT } from "./tools/getSyntheseTerritoire";

const displayChoicesInputSchema = z.object({
  choices: z
    .array(
      z.object({
        label: z.string().describe("Texte à afficher sur le bouton"),
        value: z
          .string()
          .describe("Valeur à renvoyer lorsque le bouton est cliqué"),
      }),
    )
    .describe("Liste des choix à proposer"),
});

export type DisplayChoice = z.infer<
  typeof displayChoicesInputSchema
>["choices"][number];

export const displayChoicesTool = tool({
  description:
    "Affiche des choix sous forme de boutons cliquables pour l'utilisateur. Utilise cet outil quand tu veux proposer des options à l'utilisateur. IMPORTANT : écris toujours ton message textuel AVANT d'appeler cet outil. Ne l'appelle jamais sans avoir d'abord rédigé le texte d'accompagnement.",
  inputSchema: displayChoicesInputSchema,
  execute: async ({ choices }): Promise<{ choices: DisplayChoice[] }> => ({
    choices,
  }),
});

const MODEL = "openai/gpt-oss-120b";

export class Albert {
  private static createProvider() {
    return createOpenAI({
      baseURL: "https://albert.api.etalab.gouv.fr/v1",
      apiKey: configuration().albert.apiKey,
    });
  }

  private static async saveLlmCall({
    chatId,
    userId,
    event,
  }: {
    chatId: string;
    userId: string;
    event: unknown;
  }) {
    await prisma.llm_calls.upsert({
      where: { id: chatId },
      create: {
        id: chatId,
        model: MODEL,
        transcript: event as unknown as Prisma.InputJsonValue,
        utilisateur_id: userId,
      },
      update: {
        transcript: event as unknown as Prisma.InputJsonValue,
      },
    });
  }

  static async generateText({
    chatId,
    prompt,
    systemPrompt,
    tools,
    userId,
  }: {
    chatId: string;
    prompt: string;
    systemPrompt: string;
    tools?: ToolSet;
    userId: string;
  }) {
    const albertProvider = this.createProvider();

    const response = await aiGenerateText({
      model: albertProvider.chat(MODEL),
      system: systemPrompt,
      prompt: prompt,
      stopWhen: stepCountIs(5),
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event }),
      tools,
    });

    return {
      text: response.text,
    };
  }

  static async streamText({
    chatId,
    messages,
    systemPrompt,
    userId,
    tools,
  }: {
    chatId: string;
    messages: UIMessage[];
    systemPrompt: string;
    userId: string;
    tools?: ToolSet;
  }) {
    const albertProvider = this.createProvider();
    const modelMessages = await convertToModelMessages(messages);

    return aiStreamText({
      model: albertProvider.chat(MODEL),
      system: systemPrompt,
      messages: modelMessages,
      prepareStep: ({ steps }) => {
        const lastStep = steps.at(-1);
        const lastStepCalledSynthese = lastStep?.toolCalls.some(
          (toolCall) => toolCall.toolName === "get_synthese_territoire",
        );

        if (lastStepCalledSynthese) {
          return {
            system: systemPrompt + "\n\n" + SYNTHESE_TERRITOIRE_OUTPUT_FORMAT,
          };
        }

        return {};
      },
      tools,
      stopWhen: stepCountIs(15),
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event }),
    });
  }
}
