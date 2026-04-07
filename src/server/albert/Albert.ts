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

const exportRapportInputSchema = z.object({
  nom_fichier: z
    .string()
    .describe(
      "Nom du fichier sans extension, en kebab-case (ex: synthese-ile-de-france-2025)",
    ),
  titre: z.string().describe("Titre principal du rapport"),
  date: z.string().describe("Date du rapport au format JJ/MM/AAAA"),
  resume: z.string().describe("Résumé synthétique du rapport en 2-3 phrases"),
  format: z
    .enum(["markdown", "pdf"])
    .default("markdown")
    .describe(
      "Format du rapport. Par défaut markdown. Utilise pdf uniquement si l'utilisateur le demande explicitement.",
    ),
  sections: z
    .array(
      z.object({
        titre: z.string().describe("Titre de la section"),
        parties: z
          .array(
            z.discriminatedUnion("type", [
              z.object({
                type: z.literal("paragraphe"),
                contenu: z.string().describe("Texte du paragraphe"),
              }),
              z.object({
                type: z.literal("tableau"),
                en_tetes: z.array(z.string()).describe("En-têtes des colonnes"),
                lignes: z
                  .array(z.array(z.string()))
                  .describe("Lignes du tableau"),
              }),
            ]),
          )
          .describe("Parties de la section, dans l'ordre d'affichage"),
      }),
    )
    .describe("Sections du rapport"),
});

export type ExportRapportOutput = { url: string; format: "markdown" | "pdf" };

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

const DEFAULT_MODEL = "openweight-large";

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
    model = DEFAULT_MODEL,
  }: {
    chatId: string;
    userId: string;
    event: unknown;
    model?: string;
  }) {
    await prisma.llm_calls.upsert({
      where: { id: chatId },
      create: {
        id: chatId,
        model,
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
      model: albertProvider.chat(DEFAULT_MODEL),
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
