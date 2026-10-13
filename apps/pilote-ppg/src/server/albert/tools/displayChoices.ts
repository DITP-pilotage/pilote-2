import { tool } from "ai";
import { z } from "zod";

export const displayChoicesInputSchema = z.object({
  question: z
    .string()
    .describe("Question affichée en haut du panneau de choix"),
  choices: z
    .array(
      z.object({
        label: z
          .string()
          .describe(
            "Texte du bouton, renvoyé tel quel comme message de l'utilisateur : il porte l'identifiant (ex: « CH-005 — Nom du chantier », « Vaucluse (DEPT-84) »)",
          ),
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
    "Affiche des choix cliquables à l'utilisateur. Utilise cet outil dès qu'un doute t'obligerait à choisir à sa place : plusieurs résultats d'une recherche alors qu'il en vise un seul, un numéro de territoire qui peut désigner une région ou un département (« le 84 »), une demande qui se lit de plusieurs façons. Le paramètre 'question' est affiché en haut du panneau. Le 'label' d'un choix est renvoyé tel quel comme message de l'utilisateur : il doit se suffire à lui-même et porter l'identifiant (« Vaucluse (DEPT-84) »). IMPORTANT : écris toujours ton message textuel AVANT d'appeler cet outil.",
  inputSchema: displayChoicesInputSchema,
  execute: async ({
    question,
    choices,
  }): Promise<{ question: string; choices: DisplayChoice[] }> => ({
    question,
    choices,
  }),
});
