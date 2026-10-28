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
      "Options concrètes et réalisables entre lesquelles l'utilisateur doit trancher (2 à 4)",
    ),
});

export type ClarifyChoice = z.infer<
  typeof clarifyWithChoicesInputSchema
>["choices"][number];

export type ClarifyWithChoicesOutput = {
  question: string;
  choices: ClarifyChoice[];
};

export const clarifyWithChoicesTool = tool({
  description: `Affiche à l'utilisateur un encart de choix : une question et 2 à 4 options concrètes, réalisables telles quelles, chacune formulée comme la demande qu'il aurait pu écrire.
- \`question\` porte toute l'explication : n'écris pas de texte avant l'appel.
- Après l'appel, termine ta réponse par cette seule phrase : « Choisissez une option pour continuer. »`,
  inputSchema: clarifyWithChoicesInputSchema,
  execute: async ({
    question,
    choices,
  }): Promise<ClarifyWithChoicesOutput> => ({
    question,
    choices,
  }),
});
