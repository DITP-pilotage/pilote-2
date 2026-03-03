import { createOpenAI } from "@ai-sdk/openai";
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  stepCountIs,
  ToolSet,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { Prisma } from "@prisma/client";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";
import { SYNTHESE_TERRITOIRE_OUTPUT_FORMAT } from "./tools/getSyntheseTerritoire";

const MODEL = "openai/gpt-oss-120b";

export class Albert {
  private static createProvider() {
    return createOpenAI({
      baseURL: "https://albert.api.etalab.gouv.fr/v1",
      apiKey: configuration().albert.apiKey,
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
      onFinish: async (event) => {
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
      },
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
      stopWhen: stepCountIs(5),
      onFinish: async (event) => {
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
      },
    });
  }
}
