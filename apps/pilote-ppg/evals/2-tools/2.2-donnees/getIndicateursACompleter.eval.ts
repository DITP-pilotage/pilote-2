import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_a_completer`.
 *
 * L'agent appelle l'outil, en un seul appel, quand la demande vise des valeurs
 * d'avancement non à jour (`va`), des valeurs initiales manquantes (`vi`) ou
 * des valeurs cibles manquantes (`vc`), seuls ou combinés. Quand la demande ne
 * nomme aucun type (« à mettre à jour », « est-il à jour ? »), il appelle
 * quand même l'outil, avec les motifs de son choix : la précision est décidée
 * par le code, qui renvoie lui-même la clarification (garantie par les tests
 * de l'outil), et le modèle n'appelle pas `clarify_with_choices`.
 * Sans chantier ni indicateur cité, l'appel se fait sans filtre (« mes
 * chantiers »).
 *
 * Les arguments vérifiés portent l'intention : `motifs`, `chantier_ids`,
 * `indicateur_ids`, et `perimetre` pour une région seule ou tous les
 * départements (résoudre « la Bretagne » relève du niveau 3).
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quelles valeurs d'avancement ont un retard de mise à jour sur mes chantiers ?",
    reason:
      "« mes chantiers » : tout le périmètre de l'utilisateur, sans filtre",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"] },
      },
    ],
  },
  {
    question:
      "Quelles valeurs d'avancement ne sont pas à jour sur le chantier CH-018 ?",
    reason: "chantier cité : filtre sur ce chantier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question:
      "Les valeurs d'avancement du CH-018 sont-elles à jour en Bretagne ?",
    reason:
      "une région seule est une sélection, sans ses départements ; le territoire ne retire pas le filtre chantier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["va"],
          chantier_ids: ["CH-018"],
          perimetre: { type: "SELECTION" },
        },
      },
    ],
  },
  {
    question:
      "Sur quels territoires la valeur d'avancement de l'IND-894 n'est pas à jour ?",
    reason: "indicateur cité : filtre sur cet indicateur",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question:
      "Donne les départements où la valeur d'avancement de l'IND-894 n'est pas à jour",
    reason: "« les départements » : tous les départements",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["va"],
          indicateur_ids: ["IND-894"],
          perimetre: { type: "TOUS_DEPARTEMENTS" },
        },
      },
    ],
  },
  {
    question: "Quels chantiers ont des valeurs d'avancement à mettre à jour ?",
    reason: "question vague sur les valeurs d'avancement : VA seule",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"] },
      },
    ],
  },
  {
    question: "Quels indicateurs ont un retard de mise à jour ?",
    reason:
      "la fraîcheur ne vise que les valeurs d'avancement : sans clarifier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quelles données sont périmées sur l'IND-894 ?",
    reason:
      "la fraîcheur ne vise que les valeurs d'avancement : sans clarifier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], indicateur_ids: ["IND-894"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels indicateurs du CH-018 n'ont pas de cible ?",
    reason: "exemple du ticket : VC seule, sur un chantier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { chantier_ids: ["CH-018"], motifs: ["vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels indicateurs n'ont pas de valeur initiale ?",
    reason: "VI seule",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["vi"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Sur quels territoires manque-t-il une valeur initiale ou une cible pour l'IND-894 ?",
    reason: "exemple du ticket : VI et VC, indicateur cité",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { indicateur_ids: ["IND-894"], motifs: ["vi", "vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels indicateurs n'ont pas de cible en 2027 ?",
    reason: "année nommée : l'outil n'évalue que le jalon en cours",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Quelles valeurs d'avancement ne sont pas à jour et quels indicateurs n'ont pas de cible ?",
    reason: "combinaison VA et VC : un seul appel",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va", "vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Donne toutes les valeurs à compléter : VA non à jour, VI et VC manquantes",
    reason: "les trois types : un seul appel",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va", "vi", "vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Qu'est-ce que je dois mettre à jour dans le Nord ?",
    reason:
      "aucun type nommé, territoire à résoudre : search_territoires puis l'outil, qui clarifie lui-même",
    expected: [
      { toolName: "search_territoires" },
      {
        toolName: "get_indicateurs_a_completer",
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels chantiers ont un taux d'avancement non calculé ?",
    reason: "CAS NÉGATIF : catégorie de signalement → get_chantiers_signales",
    forbidden: ["get_indicateurs_a_completer"],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : retard d'avancement → get_chantiers(view='en_retard')",
    forbidden: ["get_indicateurs_a_completer"],
  },
  {
    question:
      "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "CAS NÉGATIF : valeurs des indicateurs → get_indicateurs",
    forbidden: ["get_indicateurs_a_completer"],
  },
  {
    question: "Quelle est la VC de l'IND-894 en Bretagne ?",
    reason:
      "CAS NÉGATIF : la valeur d'un indicateur, pas une valeur manquante → get_indicateurs",
    forbidden: ["get_indicateurs_a_completer"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_a_completer",
  cases: CASES,
});
