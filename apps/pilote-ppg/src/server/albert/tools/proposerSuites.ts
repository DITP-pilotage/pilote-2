import { tool, type ModelMessage } from "ai";
import { z } from "zod";

export const PROPOSER_SUITES = "proposer_suites";

/** L'application coupe au-delà, quoi que le modèle propose (PIL-1950). */
export const NOMBRE_MAX_SUITES = 2;

export const proposerSuitesInputSchema = z.object({
  suites: z
    .array(
      z.object({
        label: z
          .string()
          .describe(
            "La demande complète, telle que l'utilisateur aurait pu l'écrire, avec son objet et son territoire : c'est ce texte qui t'est renvoyé quand il clique",
          ),
      }),
    )
    .min(1)
    .describe("Une ou deux suites concrètes"),
});

export type Suite = z.infer<typeof proposerSuitesInputSchema>["suites"][number];

export type ProposerSuitesOutput = { suites: Suite[] };

const normaliser = (texte: string) =>
  texte
    .trim()
    .toLowerCase()
    .replace(/[\s?.!]+$/u, "");

function questionsPosees(messages: ModelMessage[]): Set<string> {
  return new Set(
    messages
      .filter((message) => message.role === "user")
      .flatMap((message) =>
        typeof message.content === "string"
          ? [message.content]
          : message.content.flatMap((part) =>
              part.type === "text" ? [part.text] : [],
            ),
      )
      .map(normaliser),
  );
}

/**
 * Ce que l'application garde des suites du modèle : sans doublon, sans
 * reprendre une question déjà posée dans la conversation, deux au plus.
 */
export function suitesEligibles({
  suites,
  messages,
}: {
  suites: Suite[];
  messages: ModelMessage[];
}): Suite[] {
  const dejaPosees = questionsPosees(messages);
  const retenues = new Set<string>();

  return suites
    .filter((suite) => {
      const cle = normaliser(suite.label);
      if (cle.length === 0 || dejaPosees.has(cle) || retenues.has(cle)) {
        return false;
      }
      retenues.add(cle);
      return true;
    })
    .slice(0, NOMBRE_MAX_SUITES);
}

export const proposerSuitesTool = tool({
  description: `Affiche sous ta réponse une ou deux suites, en boutons : des demandes que l'utilisateur peut faire ensuite, d'un clic.
- Appelle-le une fois tes données reçues, avant d'écrire ta réponse.
- Puis écris ta réponse comme si les boutons n'existaient pas : ni les suites, ni d'invitation à choisir. Ta dernière phrase porte sur les données.
- Seulement pour une réponse construite avec tes outils de données, et seulement si une suite aide à approfondir la demande ou à exploiter les résultats.
- Jamais avec clarify_with_choices.`,
  inputSchema: proposerSuitesInputSchema,
  execute: async ({ suites }, { messages }): Promise<ProposerSuitesOutput> => ({
    suites: suitesEligibles({ suites, messages }),
  }),
});
