import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_non_a_jour`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande quels indicateurs, ou
 * quels territoires, ont des données qui ne sont pas à jour. Sans chantier ni
 * indicateur cité, l'appel se fait sans argument (« mes chantiers »).
 *
 * Les arguments vérifiés portent l'intention : `chantier_ids`,
 * `indicateur_ids`, et `territoire_code` uniquement pour NAT-FR (résoudre
 * « la Bretagne » relève du niveau 3).
 *
 * Les négatifs portent sur le mot « retard », qui désigne aussi l'avancement
 * (`get_chantiers`), et sur les valeurs des indicateurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les indicateurs avec un retard de mise à jour sur mes chantiers ?",
    reason:
      "« mes chantiers » : tout le périmètre de l'utilisateur, sans argument",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question:
      "Quels sont les indicateurs non mis à jour sur le chantier CH-018 ?",
    reason: "chantier cité : filtre sur ce chantier",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question: "Les données du CH-018 sont-elles à jour en Bretagne ?",
    reason:
      "chantier et territoire cités : le territoire ne retire pas le filtre chantier",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question:
      "Sur quels territoires les données de l'indicateur IND-894 ne sont pas à jour ?",
    reason:
      "indicateur cité : filtre sur cet indicateur, détail par territoire",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question:
      "La part des locaux raccordables à la fibre est-elle à jour partout ?",
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
    question: "Pourquoi l'IND-894 est-il considéré comme pas à jour ?",
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
    question: "L'IND-894 est-il à jour au niveau national ?",
    reason: "national cité : territoire_code NAT-FR",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"], territoire_code: "NAT-FR" },
      },
    ],
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
