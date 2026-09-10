import { evalite } from "evalite";
import { runAgentTurn } from "./agentTurn";
import { withEvalWorld } from "./world";
import { creerScorerJuge, MODELE_JUGE } from "./jugeAlbert";

/**
 * SPIKE — volet 3/3 : qualite redactionnelle jugee par un LLM.
 *
 * Contrairement aux deux autres evals, celui-ci est non deterministe des DEUX
 * cotes : la reponse varie, et la note du juge aussi. `trialCount` rejoue donc
 * chaque cas pour rendre cette variance visible plutot que de la subir.
 */

type CasQualite = {
  question: string;
  motif: string;
};

const CAS: { input: CasQualite }[] = [
  {
    input: {
      question:
        "Quel est le taux d'avancement de la région Bretagne pour la France entière ?",
      motif: "réponse chiffrée : doit rester sobre et sourcée",
    },
  },
  {
    input: {
      question: "Donne-moi les objectifs du chantier CH-004",
      motif: "restitution verbatim attendue, sans reformulation",
    },
  },
  {
    input: {
      question: "Quels chantiers traitent de la fraude ?",
      motif: "recherche thématique : la liste doit être exploitable",
    },
  },
];

evalite<CasQualite, { texte: string; nbOutils: number }>(
  `Qualité de réponse (juge : ${MODELE_JUGE})`,
  {
    data: () => CAS,

    task: async (input) => {
      const { text, toolCalls } = await withEvalWorld((world) =>
        runAgentTurn({ question: input.question, world }),
      );

      return { texte: text, nbOutils: toolCalls.length };
    },

    // Un juge LLM n'est pas stable : 2 passages montrent l'ecart sans tripler
    // le cout du run.
    trialCount: 2,

    scorers: [
      creerScorerJuge<CasQualite>({
        nom: "Ancrage factuel",
        critere:
          "La réponse s'appuie uniquement sur des données chiffrées ou des libellés qui semblent provenir de l'outillage, sans inventer de chiffre, de date ni de nom de chantier.",
      }),
      creerScorerJuge<CasQualite>({
        nom: "Utilité opérationnelle",
        critere:
          "Un agent public qui pilote ces chantiers peut agir directement à partir de la réponse : elle est structurée, va à l'essentiel et n'enfouit pas l'information sous du remplissage.",
      }),
    ],

    columns: ({ input, output }) => [
      { label: "Motif", value: input.motif },
      { label: "Outils", value: String(output.nbOutils) },
      { label: "Réponse", value: output.texte.slice(0, 100) || "—" },
    ],
  },
);
