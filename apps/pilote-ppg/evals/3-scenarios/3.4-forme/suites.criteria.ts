import { judged, withBase } from "../criterion";
import type { Evidence } from "../evidence";

/**
 * Les outils qui n'apportent pas de données : une réponse qui n'appelle
 * qu'eux (une clarification, une page du centre d'aide) ne se prolonge pas.
 */
const OUTILS_SANS_DONNEES = ["clarify_with_choices", "consulter_centre_aide"];

const reponseDeDonnees = (evidence: Evidence) =>
  evidence.toolCalls.some(
    (call) => !OUTILS_SANS_DONNEES.includes(call.toolName),
  );

const RULE =
  "Proposer une suite : une ou deux suites concrètes après une réponse de données, réalisables, nouvelles, non exécutées (PIL-1950)";

/**
 * Ce que l'assistant sait faire, en mots d'utilisateur : le juge ne voit pas
 * ses outils, et une suite ne se juge réalisable que contre cette liste.
 */
const CAPACITES = [
  "le taux d'avancement d'un territoire et son écart à la médiane",
  "les chantiers en retard, en difficulté ou signalés d'un territoire",
  "les indicateurs d'un chantier (valeurs initiale, actuelle, cible)",
  "l'évolution des valeurs d'un indicateur dans le temps",
  "l'historique des actions sur les valeurs d'un indicateur (imports, saisies)",
  "les valeurs d'avancement qui ne sont pas à jour, et les valeurs initiales ou cibles manquantes",
  "les commentaires et les objectifs d'un chantier",
  "une synthèse d'un territoire ou une comparaison de territoires",
  "un tableau de bord : taux, médiane, listes de chantiers, tableau d'indicateurs, cartographies du taux d'avancement ou des niveaux de confiance, courbes du taux d'avancement ou de la valeur d'un indicateur",
  "l'aide sur l'usage de PILOTE",
].join(" ; ");

/** Les critères du scénario « Suites proposées ». */
export const SUITES_CRITERIA = withBase({
  criteria: [
    // Les cas sont choisis pour qu'un prolongement utile existe : une
    // réponse de données qui s'arrête sans suite manque la règle.
    judged({
      id: "Suite proposée",
      rule: RULE,
      instruction:
        "La matière se termine par une ou deux suites : des demandes que l'utilisateur pourrait faire ensuite à l'assistant, en une phrase. Aucune suite, ou plus de deux, est non conforme.",
      applicable: reponseDeDonnees,
    }),
    judged({
      id: "Suite réalisable",
      rule: RULE,
      instruction: `Chaque suite proposée relève de ce que l'assistant sait faire : ${CAPACITES}. Un export de données (Excel, CSV), une modification de données, un envoi, une alerte, une prévision ou un rendu absent de cette liste est non conforme : cite-le. Sans suite proposée, le critère est conforme.`,
      applicable: reponseDeDonnees,
    }),
    judged({
      id: "Suite nouvelle",
      rule: RULE,
      instruction:
        "Aucune suite proposée ne redemande ce que la matière vient d'afficher, ni ce que la CONVERSATION PRÉCÉDENTE a déjà apporté. Proposer le taux d'avancement juste après l'avoir donné est non conforme. Sans suite proposée, le critère est conforme.",
      applicable: reponseDeDonnees,
    }),
    judged({
      id: "Suite sur le périmètre",
      rule: RULE,
      instruction:
        "Chaque suite proposée porte sur le territoire, le chantier ou l'indicateur de la demande ou de la réponse, et le nomme ou s'y rapporte sans ambiguïté. Une suite générique (« d'autres analyses », « autre chose ? ») ou sur un autre périmètre est non conforme. Sans suite proposée, le critère est conforme.",
      applicable: reponseDeDonnees,
    }),
    judged({
      id: "Pas de suite",
      rule: RULE,
      instruction:
        "La réponse ne propose aucune demande à faire ensuite à l'assistant : elle répond, sans « je peux aussi », « souhaitez-vous que je ». Renvoyer vers une page d'aide ou vers l'équipe PILOTE n'est pas une suite.",
      applicable: (evidence) => !reponseDeDonnees(evidence),
    }),
  ],
});
