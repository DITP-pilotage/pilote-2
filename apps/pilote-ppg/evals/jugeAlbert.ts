import { generateText, Output } from "ai";
import { z } from "zod";
import { createScorer } from "evalite";
import { Albert } from "@/server/albert/Albert";

/**
 * SPIKE — volet 3/3 : LLM-as-a-judge sur Albert, sans OpenAI.
 *
 * Evalite n'impose aucun fournisseur : ses scorers LLM prennent le modele en
 * parametre, et un scorer maison n'est qu'une fonction. Aucune OPENAI_API_KEY
 * n'intervient ici — tout passe par l'API Etalab deja utilisee en production.
 *
 * Le juge tourne sur un modele DIFFERENT de celui de production
 * (`openweight-large`) : un modele qui s'auto-evalue se sur-note, c'est un biais
 * documente.
 *
 * Attention au piege verifie pendant le spike : les alias `openweight-*` ne sont
 * pas listes par /v1/models mais pointent vers des modeles du catalogue. A
 * temperature 0 et seed fixe, `openweight-large` et `openai/gpt-oss-120b`
 * rendent des sorties identiques sur 2 prompts sur 3, et `openweight-medium` /
 * `mistral-small-3-2-24b-instruct-2506` sur 3 sur 3. Prendre gpt-oss-120b comme
 * juge reviendrait donc a faire s'auto-noter le modele de production.
 * `deepseek-v4-flash`, lui, diverge sur tous les prompts testes.
 */

export const MODELE_JUGE = "deepseek-v4-flash";

const verdictSchema = z.object({
  note: z
    .number()
    .min(0)
    .max(1)
    .describe("Note de 0 a 1, où 1 signifie parfaitement conforme."),
  justification: z
    .string()
    .describe("Une phrase expliquant la note, en français."),
});

const PROMPT_JUGE = `Tu es évaluateur de la qualité des réponses d'un assistant destiné aux agents publics français qui pilotent les chantiers prioritaires du gouvernement.

Tu notes UNIQUEMENT selon le critère qui t'est donné. Tu es strict et factuel.

Règles :
- Note de 0 à 1. 1 = pleinement conforme au critère, 0 = pas du tout.
- Tu juges la réponse, pas le sujet traité.
- Une réponse qui demande une précision légitime à l'utilisateur n'est pas une mauvaise réponse.
- Justifie en UNE phrase, en français.`;

/**
 * Interroge le modele juge et renvoie une note structuree.
 *
 * On reutilise `Albert.generateStructuredOutput` ? Non : cette methode est figee
 * sur DEFAULT_MODEL. On refait ici le meme appel avec le modele du juge, en
 * gardant `Output.object` et temperature 0 comme en production.
 */
async function demanderVerdict({
  critere,
  question,
  reponse,
}: {
  critere: string;
  question: string;
  reponse: string;
}) {
  const resultat = await generateText({
    model: Albert.createProvider().chat(MODELE_JUGE),
    system: PROMPT_JUGE,
    prompt: [
      `CRITÈRE À ÉVALUER : ${critere}`,
      ``,
      `QUESTION DE L'UTILISATEUR :`,
      question,
      ``,
      `RÉPONSE DE L'ASSISTANT :`,
      reponse,
    ].join("\n"),
    output: Output.object<z.infer<typeof verdictSchema>>({
      schema: verdictSchema,
    }),
    temperature: 0,
  });

  return resultat.output;
}

/**
 * Fabrique un scorer juge pour un critere donne.
 *
 * La justification remonte en metadata : dans l'UI d'Evalite elle s'affiche a
 * cote du score, ce qui est indispensable pour calibrer un juge (une note sans
 * motif n'est pas exploitable).
 */
export function creerScorerJuge<TInput extends { question: string }>({
  nom,
  critere,
}: {
  nom: string;
  critere: string;
}) {
  return createScorer<TInput, { texte: string }, unknown>({
    name: nom,
    description: `Juge LLM (${MODELE_JUGE}) — ${critere}`,
    scorer: async ({ input, output }) => {
      const verdict = await demanderVerdict({
        critere,
        question: input.question,
        reponse: output.texte,
      });

      // SPIKE : le tableau du terminal n'affiche pas les metadata, seulement le
      // score. Sans ce log on ne peut pas calibrer le juge en ligne de commande
      // — a retirer si les evals passent en CI, l'UI web les montre nativement.
      // eslint-disable-next-line no-console
      console.error(
        `    [juge:${nom}] ${verdict.note} — ${verdict.justification}`,
      );

      return {
        score: verdict.note,
        metadata: verdict.justification,
      };
    },
  });
}
