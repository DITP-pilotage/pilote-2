import { judged, mechanical, withBase } from "../criterion";
import type { Evidence } from "../evidence";
import { checkNoToolName } from "../mechanicalChecks";

/**
 * Les outils qui n'apportent pas de données : une réponse qui n'appelle
 * qu'eux (une clarification, une page du centre d'aide) ne se prolonge pas.
 */
const OUTILS_SANS_DONNEES = [
  "clarify_with_choices",
  "consulter_centre_aide",
  "proposer_suites",
];

const reponseDeDonnees = (evidence: Evidence) =>
  evidence.toolCalls.some(
    (call) => !OUTILS_SANS_DONNEES.includes(call.toolName),
  );

const avecSuites = (evidence: Evidence) => evidence.suites.length > 0;

const sansClarification = (evidence: Evidence) =>
  !evidence.toolCalls.some((call) => call.toolName === "clarify_with_choices");

/**
 * Les en-têtes que gpt-oss écrit quand il rédige ses suites au lieu de les
 * proposer en boutons, relevés en eval le 2026-11-05 : « Proposer des
 * suites : », « Propositions de suite », « Prochaines actions possibles ».
 */
const SUITE_ECRITE =
  /propos\w*\s+(?:de|des|une)\s+suites?|prochaines?\s+actions?|pour aller plus loin/iu;

/** La phrase qui clôt une clarification, écrite sans encart de choix. */
const CHOIX_SANS_ENCART = /choisissez une option/iu;

const RULE =
  "Proposer une suite : une ou deux suites en boutons après une réponse de données, réalisables, nouvelles, non exécutées (PIL-1950)";

/**
 * Ce que l'assistant sait faire, en mots d'utilisateur : le juge ne voit pas
 * ses outils, et une suite ne se juge réalisable que contre cette liste.
 */
const CAPACITES = [
  "le taux d'avancement d'un territoire et son écart à la médiane",
  "les chantiers en retard, en difficulté ou signalés d'un territoire",
  "les indicateurs d'un chantier (valeur initiale, valeur d'avancement, valeur cible)",
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
    mechanical({
      id: "Suites affichées",
      rule: RULE,
      applicable: reponseDeDonnees,
      check: (evidence) => ({
        ok: avecSuites(evidence),
        detail: avecSuites(evidence)
          ? evidence.suites.join(" | ")
          : "aucune suite affichée",
      }),
    }),
    mechanical({
      id: "Pas de suite",
      rule: RULE,
      applicable: (evidence) => !reponseDeDonnees(evidence),
      check: (evidence) => ({
        ok: !avecSuites(evidence),
        detail: avecSuites(evidence)
          ? `suites affichées à tort : ${evidence.suites.join(" | ")}`
          : "aucune suite, conforme",
      }),
    }),
    mechanical({
      id: "Pas de suite écrite",
      rule: RULE,
      check: (evidence) => {
        const trouve = evidence.answer.match(SUITE_ECRITE)?.[0];
        return trouve
          ? {
              ok: false,
              detail: `suites écrites dans la réponse : « ${trouve} »`,
            }
          : { ok: true, detail: "aucune suite écrite" };
      },
    }),
    mechanical({
      id: "Pas de choix sans encart",
      rule: "Clarifier : « Choisissez une option pour continuer. » suit clarify_with_choices, et lui seul",
      applicable: sansClarification,
      check: (evidence) =>
        CHOIX_SANS_ENCART.test(evidence.answer)
          ? { ok: false, detail: "invite à choisir sans encart de choix" }
          : { ok: true, detail: "aucune invite à choisir" },
    }),
    mechanical({
      id: "Suites sans nom d'outil",
      rule: "Règle 5 : n'expose ni nom d'outil, ni nom de champ",
      applicable: avecSuites,
      check: (evidence) =>
        checkNoToolName({ text: evidence.suites.join("\n") }),
    }),
    judged({
      id: "Suites hors du texte",
      rule: RULE,
      instruction:
        "Le texte de la réponse, hors du bloc SUITES PROPOSÉES, ne propose pas lui-même de demande à faire ensuite : l'interface affiche les suites en boutons. Une phrase ou une liste de propositions est non conforme, quel que soit son en-tête : « Souhaitez-vous que je… », « Je peux aussi… », « Vous pouvez demander… », « Proposer des suites : - Voir les chantiers en retard ». Renvoyer vers une page d'aide ou vers l'équipe PILOTE n'est pas une suite.",
      // La phrase de clôture d'une clarification n'est pas une suite écrite
      applicable: sansClarification,
    }),
    judged({
      id: "Suite réalisable",
      rule: RULE,
      instruction: `Chaque suite du bloc SUITES PROPOSÉES relève de ce que l'assistant sait faire : ${CAPACITES}. Un export de données (Excel, CSV), une modification de données, un envoi, une alerte, une prévision ou un rendu absent de cette liste est non conforme : cite-le.`,
      applicable: avecSuites,
    }),
    judged({
      id: "Suite nouvelle",
      rule: RULE,
      instruction:
        "Aucune suite du bloc SUITES PROPOSÉES ne redemande ce que la réponse vient d'afficher, ni ce que la CONVERSATION PRÉCÉDENTE a déjà apporté. Proposer le taux d'avancement juste après l'avoir donné est non conforme.",
      applicable: avecSuites,
    }),
    judged({
      id: "Suite sur le périmètre",
      rule: RULE,
      instruction:
        "Chaque suite du bloc SUITES PROPOSÉES est une demande complète, qui nomme le territoire, le chantier ou l'indicateur de la demande ou de la réponse : elle se comprend seule, envoyée telle quelle. Une suite générique (« d'autres analyses »), sans son objet (« voir ses commentaires ») ou sur un autre périmètre est non conforme.",
      applicable: avecSuites,
    }),
  ],
});
