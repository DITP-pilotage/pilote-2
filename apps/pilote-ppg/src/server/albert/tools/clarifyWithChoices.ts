import { tool } from "ai";
import { z } from "zod";

export const clarifyWithChoicesInputSchema = z.object({
  question: z
    .string()
    .describe("Question affichée en haut du panneau de choix"),
  choices: z
    .array(
      z.object({
        outils: z
          .array(z.string())
          .min(1)
          .describe(
            "Les outils que tu appellerais si l'utilisateur choisissait cette option. Une option qu'aucun de tes outils ne sait traiter n'est pas réalisable : ne la propose pas.",
          ),
        label: z
          .string()
          .describe(
            "La demande complète, telle que l'utilisateur aurait pu l'écrire, avec son objet et son territoire : c'est ce texte qui t'est renvoyé quand il clique",
          ),
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

/** Ce que l'interface reçoit : `outils` ne sert qu'à faire vérifier chaque option au modèle. */
export type ClarifyChoice = Omit<
  z.infer<typeof clarifyWithChoicesInputSchema>["choices"][number],
  "outils"
>;

export type ClarifyWithChoicesOutput = {
  question: string;
  choices: ClarifyChoice[];
};

export const clarifyWithChoicesTool = tool({
  description: `Affiche à l'utilisateur un encart de choix : une question et 2 à 4 options concrètes, réalisables telles quelles, chacune formulée comme la demande qu'il aurait pu écrire.
- Pour chaque option, nomme dans \`outils\` ceux que tu appellerais si elle était choisie, et vérifie dans leur description qu'ils savent la traiter.
- \`question\` porte toute l'explication : n'écris pas de texte avant l'appel.
- Appelle-le seul : aucun outil de données dans le même tour, ni avant ni après.
- Après l'appel, termine ta réponse par cette seule phrase : « Choisissez une option pour continuer. »`,
  inputSchema: clarifyWithChoicesInputSchema,
  execute: async ({
    question,
    choices,
  }): Promise<ClarifyWithChoicesOutput> => ({
    question,
    choices: choices.map(({ label, value }) => ({ label, value })),
  }),
});
