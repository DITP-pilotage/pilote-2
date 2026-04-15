import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText as aiStreamText,
  ToolSet,
  UIMessage,
  wrapLanguageModel,
} from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { Prisma } from "@prisma/client";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";

export function withOptionalDevTools(model: LanguageModelV3): LanguageModelV3 {
  if (!configuration().albert.devTools) {
    return model;
  }
  return wrapLanguageModel({ model, middleware: devToolsMiddleware() });
}

const DEFAULT_MODEL = "openweight-large";

export class Albert {
  static createProvider() {
    return createOpenAI({
      baseURL: "https://albert.api.etalab.gouv.fr/v1",
      apiKey: configuration().albert.apiKey,
    });
  }

  private static async saveLlmCall({
    chatId,
    userId,
    event,
    model = DEFAULT_MODEL,
  }: {
    chatId: string;
    userId: string;
    event: unknown;
    model?: string;
  }) {
    // Round-trip JSON pour produire un objet plain : JSON.stringify skippe
    // silencieusement les schémas Zod attachés aux outils, alors que le
    // sérialiseur interne de Prisma plantait sur leur toJSON (addIssue).
    const transcript = JSON.parse(
      JSON.stringify(event),
    ) as Prisma.InputJsonValue;

    const usage = (
      event as {
        usage?: { inputTokens?: number; outputTokens?: number };
      }
    )?.usage;

    await prisma.llm_calls.create({
      data: {
        chat_id: chatId,
        model,
        transcript,
        input_tokens: usage?.inputTokens ?? 0,
        output_tokens: usage?.outputTokens ?? 0,
        utilisateur_id: userId,
      },
    });
  }

  static async streamText({
    chatId,
    messages,
    systemPrompt,
    userId,
    tools,
    model = DEFAULT_MODEL,
  }: {
    chatId: string;
    messages: UIMessage[];
    systemPrompt: string;
    userId: string;
    tools?: ToolSet;
    model?: string;
  }) {
    const albertProvider = this.createProvider();
    const modelMessages = await convertToModelMessages(messages);

    return aiStreamText({
      model: withOptionalDevTools(albertProvider.chat(model)),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(50),
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event, model }),
    });
  }
}
