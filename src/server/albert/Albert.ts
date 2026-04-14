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
import { randomUUID } from "crypto";
import { configuration } from "@/config";
import { prisma } from "@/server/db/prisma";
import { genererRapportPDF } from "@/server/albert/pdf/genererRapportPDF";
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";
import {
  exportRapportInputSchema,
  ExportRapportOutput,
} from "@/server/albert/exportRapportSchema";

export function createExportRapportTool({
  rapportFileStorage,
}: {
  rapportFileStorage: RapportFileStorage;
}) {
  return ({ userId }: { userId: string }) => {
    return tool({
      description:
        "Génère un rapport structuré synthétisant la discussion. Appelle cet outil quand l'utilisateur demande d'exporter ou télécharger un rapport. Le rapport doit contenir un titre, une date, un résumé et des sections structurées reprenant les données clés de la conversation.",
      inputSchema: exportRapportInputSchema,
      execute: async (input): Promise<ExportRapportOutput> => {
        const shortId = randomUUID().slice(0, 8);
        const ext = input.format === "pdf" ? "pdf" : "md";
        const filename = `${input.nom_fichier}-${shortId}.${ext}`;

        if (input.format === "pdf") {
          const buffer = await genererRapportPDF(input);
          const url = await rapportFileStorage.save(userId, filename, buffer);
          return { url, format: "pdf" };
        }

        const markdown = buildRapportMarkdown(input);
        const url = await rapportFileStorage.save(userId, filename, markdown);
        return { url, format: "markdown" };
      },
    });
  };
}

export const displayChoicesInputSchema = z.object({
  question: z
    .string()
    .describe("Question affichée en haut du panneau de choix"),
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
    "Affiche des choix dans un panneau pour l'utilisateur. Le paramètre 'question' est la question affichée en haut du panneau. Utilise cet outil quand tu veux proposer des options à l'utilisateur. IMPORTANT : écris toujours ton message textuel AVANT d'appeler cet outil. Ne l'appelle jamais sans avoir d'abord rédigé le texte d'accompagnement.",
  inputSchema: displayChoicesInputSchema,
  execute: async ({
    question,
    choices,
  }): Promise<{ question: string; choices: DisplayChoice[] }> => ({
    question,
    choices,
  }),
});

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

  static async generateText<OUTPUT>({
    chatId,
    prompt,
    systemPrompt,
    tools,
    userId,
    abortSignal,
    output,
  }: {
    chatId: string;
    prompt: string;
    systemPrompt: string;
    tools?: ToolSet;
    userId: string;
    abortSignal?: AbortSignal;
    output?: OUTPUT;
  }) {
    const albertProvider = this.createProvider();

    return aiGenerateText({
      model: albertProvider.chat(DEFAULT_MODEL),
      system: systemPrompt,
      prompt: prompt,
      stopWhen: stepCountIs(50),
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event }),
      tools,
      abortSignal,
      output: output as Parameters<typeof aiGenerateText>[0]["output"],
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
      model: albertProvider.chat(model),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(50),
      onFinish: (event) => Albert.saveLlmCall({ chatId, userId, event, model }),
    });
  }
}
