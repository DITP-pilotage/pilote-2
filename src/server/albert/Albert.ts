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
import { randomUUID } from "node:crypto";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";

const MODEL = "openai/gpt-oss-120b";

export class Albert {
  private static createProvider() {
    return createOpenAI({
      baseURL: "https://albert.api.etalab.gouv.fr/v1",
      apiKey: configuration().albert.apiKey,
    });
  }

  static async generateText({
    prompt,
    systemPrompt,
    tools,
    userId,
  }: {
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
        await prisma.llm_calls.create({
          data: {
            id: randomUUID(),
            model: MODEL,
            transcript: event as unknown as Prisma.InputJsonValue,
            utilisateur_id: userId,
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
    messages,
    systemPrompt,
    userId,
    tools,
  }: {
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
      tools,
      stopWhen: stepCountIs(5),
      onFinish: async (event) => {
        await prisma.llm_calls.create({
          data: {
            id: randomUUID() as string,
            model: MODEL,
            transcript: event as unknown as Prisma.InputJsonValue,
            utilisateur_id: userId,
          },
        });
      },
    });
  }
}
