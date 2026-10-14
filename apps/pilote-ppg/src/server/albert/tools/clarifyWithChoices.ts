import { tool } from "ai";
import { z } from "zod";

export const clarifyWithChoicesInputSchema = z.object({
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
    .min(2)
    .describe(
      "Options concrètes et réalisables entre lesquelles l'utilisateur doit trancher (au moins 2)",
    ),
});

export type ClarifyChoice = z.infer<
  typeof clarifyWithChoicesInputSchema
>["choices"][number];

export const clarifyWithChoicesTool = tool({
  description:
    "Demande à l'utilisateur de lever un doute en choisissant parmi des options que tu as identifiées. Appelle cet outil AVANT de produire une réponse dès que : plusieurs candidats correspondent (chantiers, indicateurs, territoires) ; la demande admet plusieurs interprétations qui mènent à des réponses différentes ; ou la demande ne peut pas être satisfaite telle quelle (ex. un type de graphique que le dashboard ne sait pas produire) et que tu peux proposer des alternatives réalisables. Mieux vaut demander que deviner. IMPORTANT : écris toujours ton message textuel AVANT d'appeler cet outil. Ne l'appelle jamais sans avoir d'abord rédigé le texte d'accompagnement.",
  inputSchema: clarifyWithChoicesInputSchema,
  execute: async ({
    question,
    choices,
  }): Promise<{ question: string; choices: ClarifyChoice[] }> => ({
    question,
    choices,
  }),
});
