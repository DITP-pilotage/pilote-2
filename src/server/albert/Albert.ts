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

const exportRapportInputSchema = z.object({
  contenu: z.string().describe("Contenu du rapport en texte brut"),
});

export type ExportRapportOutput = { contenu: string };

export const exportRapportTool = tool({
  description:
    "Déclenche le téléchargement d'un rapport en texte brut côté client. Appelle cet outil une fois que tu as assemblé le contenu du rapport à partir des données récupérées.",
  inputSchema: exportRapportInputSchema,
  execute: async ({ contenu }): Promise<ExportRapportOutput> => ({ contenu }),
});

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

const displayValeursIndicateurInputSchema = z.object({
  indicateurs: z.array(
    z.object({
      indicateur_id: z.string(),
      nom: z.string(),
      unite_mesure: z.string().nullable(),
      valeur_initiale: z.number().nullable(),
      date_valeur_initiale: z.string().nullable(),
      valeur_actuelle: z.number().nullable(),
      date_valeur_actuelle: z.string().nullable(),
      valeur_cible: z.number().nullable(),
      date_valeur_cible: z.string().nullable(),
      taux_avancement: z.number().nullable(),
    }),
  ),
});

export type ValeursIndicateurDisplay = z.infer<
  typeof displayValeursIndicateurInputSchema
>["indicateurs"][number];

export const displayValeursIndicateurTool = tool({
  description:
    "Affiche les valeurs des indicateurs dans un tableau visuel. OBLIGATOIRE après get_valeurs_indicateur : passe-lui le tableau d'indicateurs tel quel. IMPORTANT : n'écris AUCUN texte, réponds UNIQUEMENT avec cet appel d'outil. Ne génère JAMAIS les données des indicateurs en texte ou en markdown.",
  inputSchema: displayValeursIndicateurInputSchema,
  execute: async ({
    indicateurs,
  }): Promise<{ indicateurs: ValeursIndicateurDisplay[] }> => ({
    indicateurs,
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
