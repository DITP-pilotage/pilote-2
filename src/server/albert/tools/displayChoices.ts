import { tool } from "ai";
import { z } from "zod";

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
