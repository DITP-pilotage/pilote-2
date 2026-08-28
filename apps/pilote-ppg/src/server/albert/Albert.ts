import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  Output,
  stepCountIs,
  streamText as aiStreamText,
  ToolSet,
  UIMessage,
  wrapLanguageModel,
} from "ai";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { Prisma } from "@prisma/client";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { z } from "zod";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";

export function withOptionalDevTools(model: LanguageModelV4): LanguageModelV4 {
  if (!configuration().albert.devTools) {
    return model;
  }
  return wrapLanguageModel({ model, middleware: devToolsMiddleware() });
}

const DEFAULT_MODEL = "openweight-large";

const TEMPERATURE_STREAM_TEXT = 0.2;
const TEMPERATURE_STRUCTURED_OUTPUT = 0;

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

    // ai v7 a change le sens de `usage` dans onFinish : il porte desormais le CUMUL
    // de toutes les etapes, alors qu'en v6 il portait la DERNIERE etape. Avec
    // `stopWhen: stepCountIs(50)` et 11 outils, le multi-etapes est la norme ici :
    // conserver `event.usage` changerait silencieusement le sens des colonnes
    // llm_calls.input_tokens / output_tokens et rendrait l'historique incomparable.
    // On lit donc explicitement la derniere etape, comme avant. Le cumul reste
    // disponible via `event.usage` si l'equipe decide un jour de basculer.
    const évènement = event as {
      finalStep?: { usage?: { inputTokens?: number; outputTokens?: number } };
      usage?: { inputTokens?: number; outputTokens?: number };
    };
    const usage = évènement?.finalStep?.usage ?? évènement?.usage;

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

  static async generateStructuredOutput<T extends z.ZodType>({
    systemPrompt,
    prompt,
    schema,
    abortSignal,
  }: {
    systemPrompt: string;
    prompt: string;
    schema: T;
    abortSignal?: AbortSignal;
  }): Promise<z.infer<T>> {
    const albertProvider = this.createProvider();
    const result = await generateText({
      model: withOptionalDevTools(albertProvider.chat(DEFAULT_MODEL)),
      system: systemPrompt,
      prompt,
      stopWhen: stepCountIs(5),
      // `Output.object` infere son type depuis le schema ; quand celui-ci est un
      // parametre generique, l'inference retombe sur `unknown`. On declare donc la
      // sortie attendue explicitement.
      output: Output.object<z.infer<T>>({ schema }),
      temperature: TEMPERATURE_STRUCTURED_OUTPUT,
      abortSignal,
    });
    return result.output;
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
      temperature: TEMPERATURE_STREAM_TEXT,
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event, model }),
    });
  }
}
