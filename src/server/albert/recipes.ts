import { tool } from "ai";
import { z } from "zod";
import { SYNTHESE_TERRITOIRE_OUTPUT_FORMAT } from "./outputFormats/syntheseTerritoire";
import { VALEURS_INDICATEUR_OUTPUT_FORMAT } from "./outputFormats/valeursIndicateur";

type Recipe = {
  steps: string[];
  outputFormat: string | null;
  notes?: string;
};

const RECIPES: Record<string, Recipe> = {
  synthese_territoire: {
    steps: [
      "Appelle get_taux_avancement_territoire",
      "Appelle get_chantiers_en_retard",
      "Appelle get_chantiers_en_difficulte",
      "Tu peux appeler ces 3 outils en parallèle.",
    ],
    outputFormat: SYNTHESE_TERRITOIRE_OUTPUT_FORMAT,
    notes:
      "Pour les REG-XXX, demande d'abord si région seule ou région + départements via display_choices.",
  },
  taux_avancement: {
    steps: ["Appelle get_taux_avancement_territoire"],
    outputFormat: null,
  },
  chantiers_en_retard: {
    steps: ["Appelle get_chantiers_en_retard"],
    outputFormat: null,
  },
  chantiers_en_difficulte: {
    steps: ["Appelle get_chantiers_en_difficulte"],
    outputFormat: null,
  },
  valeurs_indicateur: {
    steps: [
      "Appelle get_valeurs_indicateur",
      "Appelle display_valeurs_indicateur avec les données reçues",
    ],
    outputFormat: VALEURS_INDICATEUR_OUTPUT_FORMAT,
  },
  exporter_rapport: {
    steps: [
      "Analyse la conversation pour identifier les données pertinentes.",
      "Assemble le rapport en texte brut structuré et appelle export_rapport avec le contenu.",
    ],
    outputFormat:
      'Réponds "Votre rapport est disponible." IMPORTANT : n\'invente et ne donne JAMAIS de lien.',
  },
  autre: {
    steps: [],
    outputFormat: null,
    notes: "Réponds directement sans appeler d'outil de données.",
  },
};

const getInstructionsInputSchema = z.object({
  intent: z
    .enum([
      "synthese_territoire",
      "taux_avancement",
      "chantiers_en_retard",
      "chantiers_en_difficulte",
      "valeurs_indicateur",
      "exporter_rapport",
      "autre",
    ])
    .describe("L'intention détectée de l'utilisateur"),
});

export const getInstructionsTool = tool({
  description: `Appelle TOUJOURS cet outil EN PREMIER avant de répondre à une question sur les données PILOTE.
Cet outil te retourne les instructions à suivre pour répondre correctement.`,
  inputSchema: getInstructionsInputSchema,
  execute: async ({ intent }): Promise<Recipe> => RECIPES[intent],
});
