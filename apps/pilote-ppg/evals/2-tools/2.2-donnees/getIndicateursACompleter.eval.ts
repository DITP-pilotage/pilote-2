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
 * `indicateur_ids`, et `perimetre` pour NAT-FR, une région avec ses
 * départements ou un code cité (résoudre « la Bretagne » relève du niveau 3).
 *
 * Les négatifs portent sur le mot « retard », qui désigne aussi l'avancement
 * (`get_chantiers`), sur le taux non calculé (`get_chantiers_signales`) et sur
 * les valeurs des indicateurs (`get_indicateurs`).
 *
 * Référence « avant » (dev, 2026-11-05, deux anciens outils) : valeurs
 * d'avancement non à jour 95,8 % et valeurs initiales et cibles manquantes
 * 94,9 %.
 *
 * Référence « après (tâche 8) », résumé en phrase (3 essais par cas, 32 cas) :
 * moyenne 0.865 puis 0.854 au second passage (96 évals). Les cas sans type de
 * valeurs nommé échouaient surtout parce que le modèle appelait
 * `clarify_with_choices` après la clarification renvoyée par l'outil.
 *
 * Référence « après (2) », résumé plat (une ligne par indicateur) : moyenne
 * 0.964. Restent en échec « Quels indicateurs n'ont pas de cible en 2027 ? »
 * (appel de `clarify_with_choices`, ou aucun appel) et « Qu'est-ce que je dois
 * mettre à jour dans le Nord ? » (un essai sans `search_territoires`).
 *
 * Référence « après (4) », indicateurs regroupés par chantier : moyenne
 * 0.964. Restent en échec « Quels indicateurs n'ont pas de cible en 2027 ? »
 * (0 sur 3) et « Qu'est-ce que je dois mettre à jour dans le Nord ? » (0.5).
 *
 * Référence « après (5) » avec la consigne de fin et la règle du jalon dans la
 * description (décision 17), le 2026-11-05 : moyenne 0.969. « Pas de cible en
 * 2027 » passe (3 sur 3). Restent « Pourquoi la valeur d'avancement de l'IND-894
 * … » et « Donne les départements … IND-894 … » (0.67 chacun) et « Qu'est-ce que
 * je dois mettre à jour dans le Nord ? » (0.67).
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
      "La valeur d'avancement de la part des locaux raccordables à la fibre est-elle à jour partout ?",
    reason:
      "indicateur désigné par son libellé : search_indicateurs pour trouver son identifiant, puis l'outil",
    expected: [
      { toolName: "search_indicateurs" },
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], indicateur_ids: ["IND-019"] },
      },
    ],
  },
  {
    question:
      "Pourquoi la valeur d'avancement de l'IND-894 est-elle considérée comme pas à jour ?",
    reason:
      "explication du retard : appeler l'outil sur l'indicateur (motif VA), puis expliquer la règle de périodicité et de délai sans date",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question:
      "La valeur d'avancement de l'IND-894 est-elle à jour au niveau national ?",
    reason: "national cité : périmètre réduit à NAT-FR",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["va"],
          indicateur_ids: ["IND-894"],
          perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] },
        },
      },
    ],
  },
  {
    question:
      "Sur quels territoires le CH-018 a des valeurs d'avancement non à jour ?",
    reason: "territoires nommés sur un chantier : filtre chantier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"], chantier_ids: ["CH-018"] },
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
    question:
      "Les valeurs d'avancement du CH-018 sont-elles à jour en REG-53 et ses départements ?",
    reason: "une région et ses départements, en un seul appel",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["va"],
          chantier_ids: ["CH-018"],
          perimetre: {
            type: "REGION_ET_SES_DEPARTEMENTS",
            region_code: "REG-53",
          },
        },
      },
    ],
  },
  {
    question:
      "Quelles valeurs d'avancement ne sont pas à jour, avec le détail par territoire ?",
    reason: "détail demandé sur tout le périmètre : motif VA seul",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va"] },
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
    question: "Quels indicateurs n'ont ni VI ni VC au national ?",
    reason: "« ni VI ni VC » : l'une ou l'autre manquante, périmètre NAT-FR",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["vi", "vc"],
          perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] },
        },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quelles cibles sont à mettre à jour sur le CH-018 ?",
    reason: "cible nommée : pas de clarification",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { chantier_ids: ["CH-018"], motifs: ["vc"] },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Valeurs initiales et cibles manquantes sur tout mon périmètre",
    reason: "libellé du bouton « VI et VC » : pas de nouvelle clarification",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["vi", "vc"] },
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
    question:
      "Les trois sur tout mon périmètre : valeurs d'avancement non à jour, valeurs initiales et cibles manquantes",
    reason: "libellé du bouton « les trois » : un seul appel",
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
    question:
      "Quels départements de Bretagne ont le plus de saisies en retard ?",
    reason:
      "« saisies en retard » : valeurs d'avancement non à jour, la région et ses départements",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: {
          motifs: ["va"],
          perimetre: { type: "REGION_ET_SES_DEPARTEMENTS" },
        },
      },
    ],
  },
  {
    question:
      "Combien de régions et de départements ont des valeurs cibles manquantes sur le CH-018 ?",
    reason: "VC seule sur un chantier, tous territoires : compteurs de l'outil",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["vc"], chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question: "Le CH-018 est-il à jour en Bretagne ?",
    reason:
      "aucun type de valeurs nommé, même avec un chantier et un territoire : l'outil clarifie",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Fais-moi un récapitulatif chantier par chantier des mises à jour nécessaires : VA, VI et VC avec le détail des territoires concernés",
    reason: "les trois types nommés : un seul appel, sans clarifier",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
        input: { motifs: ["va", "vi", "vc"] },
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
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_a_completer",
  cases: CASES,
});
