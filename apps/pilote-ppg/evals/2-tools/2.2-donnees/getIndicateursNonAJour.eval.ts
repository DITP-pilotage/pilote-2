import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_non_a_jour`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande quels indicateurs, ou
 * quels territoires, ont des valeurs d'avancement qui ne sont pas à jour. Sans
 * mention de ces valeurs, la demande se clarifie (voir `clarify_with_choices`).
 * Sans chantier ni indicateur cité, l'appel se fait sans argument (« mes
 * chantiers »).
 *
 * Les arguments vérifiés portent l'intention : `chantier_ids`,
 * `indicateur_ids`, `detail`, et `perimetre` pour NAT-FR ou un code cité
 * (résoudre « la Bretagne » relève du niveau 3).
 *
 * Les négatifs portent sur le mot « retard », qui désigne aussi l'avancement
 * (`get_chantiers`), et sur les valeurs des indicateurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quelles valeurs d'avancement ont un retard de mise à jour sur mes chantiers ?",
    reason:
      "« mes chantiers » : tout le périmètre de l'utilisateur, sans argument",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question:
      "Quelles valeurs d'avancement ne sont pas à jour sur le chantier CH-018 ?",
    reason: "chantier cité : filtre sur ce chantier",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
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
        toolName: "get_indicateurs_non_a_jour",
        input: {
          chantier_ids: ["CH-018"],
          perimetre: { type: "SELECTION" },
        },
      },
    ],
  },
  {
    question:
      "Sur quels territoires la valeur d'avancement de l'IND-894 n'est pas à jour ?",
    reason:
      "indicateur cité : filtre sur cet indicateur, détail par territoire",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"], detail: "territoires" },
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
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-019"] },
      },
    ],
  },
  {
    question:
      "Pourquoi la valeur d'avancement de l'IND-894 est-elle considérée comme pas à jour ?",
    reason:
      "explication du retard : l'outil renvoie la périodicité et le délai de mise à jour",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question:
      "La valeur d'avancement de l'IND-894 est-elle à jour au niveau national ?",
    reason: "national cité : périmètre réduit à NAT-FR",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: {
          indicateur_ids: ["IND-894"],
          perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] },
        },
      },
    ],
  },
  {
    question:
      "Sur quels territoires le CH-018 a des valeurs d'avancement non à jour ?",
    reason: "territoires nommés sur un chantier : détail, sans indicateur",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"], detail: "territoires" },
      },
    ],
  },
  {
    question:
      "Donne les départements où la valeur d'avancement de l'IND-894 n'est pas à jour",
    reason: "« les départements » : tous les départements, en détail",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: {
          indicateur_ids: ["IND-894"],
          detail: "territoires",
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
        toolName: "get_indicateurs_non_a_jour",
        input: {
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
    reason: "détail demandé explicitement sur tout le périmètre",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { detail: "territoires" },
      },
    ],
  },
  {
    question: "Quels chantiers ont des valeurs d'avancement à mettre à jour ?",
    reason: "question vague : pas de détail par territoire",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : retard d'avancement → get_chantiers(view='en_retard')",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
  {
    question:
      "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "CAS NÉGATIF : valeurs des indicateurs → get_indicateurs",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_non_a_jour",
  cases: CASES,
});
