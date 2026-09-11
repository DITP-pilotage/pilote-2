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

export const JUDGE_MODEL = "deepseek-v4-flash";

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
- Justifie en UNE phrase, en français.

Livrables produits par un outil :
- \`create_dashboard\` et \`export_rapport\` produisent un artefact — tableau de bord, fichier — que l'interface affiche à l'utilisateur. Son contenu ne figure PAS dans le texte que tu lis.
- Si la liste des outils appelés contient l'un de ces deux outils, le texte n'est qu'un accompagnement : ne le pénalise pas pour ne pas reproduire le contenu de l'artefact, et juge-le comme une introduction.
- En revanche, si aucun de ces outils n'a été appelé, un texte vide ou réduit à une phrase d'annonce ne livre rien : note-le comme tel.`;

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
  outilsAppeles,
}: {
  critere: string;
  question: string;
  reponse: string;
  /**
   * `undefined` quand l'appelant ne sait pas quels outils ont tourné — le juge
   * n'entend alors pas parler d'outils du tout. À distinguer du tableau vide,
   * qui affirme qu'aucun outil n'a été appelé.
   */
  outilsAppeles: string[] | undefined;
}) {
  const resultat = await generateText({
    model: Albert.createProvider().chat(JUDGE_MODEL),
    system: PROMPT_JUGE,
    prompt: [
      `CRITÈRE À ÉVALUER : ${critere}`,
      ``,
      `QUESTION DE L'UTILISATEUR :`,
      question,
      ...(outilsAppeles
        ? [
            ``,
            `OUTILS APPELÉS PAR L'ASSISTANT :`,
            outilsAppeles.length > 0 ? outilsAppeles.join(", ") : "aucun",
          ]
        : []),
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
 *
 * Le juge recoit les NOMS des outils appeles, pas leurs sorties. C'est le
 * minimum pour qu'il ne se trompe pas sur les scenarios dont le livrable est un
 * artefact : quand `create_dashboard` rend un tableau de bord, le contenu n'est
 * pas dans le texte, et le juge notait une phrase d'introduction comme une
 * reponse vide. Lui dire seulement que ces artefacts existent ne suffirait pas
 * — il ne distinguerait plus une introduction accompagnant un dashboard d'une
 * introduction accompagnant rien.
 */
export function createJudgeScorer<TInput extends { question: string }>({
  name,
  criterion,
}: {
  name: string;
  criterion: string;
}) {
  return createScorer<
    TInput,
    { text: string; toolCalls?: { toolName: string }[] },
    unknown
  >({
    name,
    description: `Juge LLM (${JUDGE_MODEL}) — ${criterion}`,
    scorer: async ({ input, output }) => {
      const verdict = await demanderVerdict({
        critere: criterion,
        question: input.question,
        reponse: output.text,
        // Volontairement `undefined` et non `[]` quand la tâche ne fournit pas
        // de tool calls : la calibration du juge soumet des réponses écrites à
        // la main, où la notion d'outil appelé n'a pas de sens. Les confondre
        // conduit le juge à déduire la fabrication de l'absence d'appel.
        outilsAppeles: output.toolCalls?.map((call) => call.toolName),
      });

      // SPIKE : le tableau du terminal n'affiche pas les metadata, seulement le
      // score. Sans ce log on ne peut pas calibrer le juge en ligne de commande
      // — a retirer si les evals passent en CI, l'UI web les montre nativement.
      // eslint-disable-next-line no-console
      console.error(
        `    [juge:${name}] ${verdict.note} — ${verdict.justification}`,
      );

      return {
        score: verdict.note,
        metadata: verdict.justification,
      };
    },
  });
}
