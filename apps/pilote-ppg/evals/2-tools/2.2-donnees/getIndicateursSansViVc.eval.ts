import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_sans_vi_vc`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande quels indicateurs ont un
 * taux d'avancement qui ne peut pas être calculé, ou quels indicateurs n'ont
 * pas de valeur initiale (VI) ou de valeur cible (VC). « Sans VI ni VC » se lit
 * comme le mail PVA : sans VI ou sans VC.
 *
 * Les arguments vérifiés portent l'intention : `missing` quand une seule valeur
 * est demandée, `chantier_ids` et `indicateur_ids`.
 *
 * Les négatifs portent sur la mise à jour des données (« non à jour », « en
 * retard »), qui reste à `get_indicateurs_non_a_jour`.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels indicateurs ont un taux d'avancement qui ne peut pas être calculé sur mes chantiers ?",
    reason:
      "« mes chantiers » : tout le périmètre de l'utilisateur, sans argument",
    expected: [{ toolName: "get_indicateurs_sans_vi_vc" }],
  },
  {
    question: "Quels sont les indicateurs sans VI ni VC du CH-018 ?",
    reason: "« sans VI ni VC » = sans VI ou sans VC, filtre sur le chantier",
    expected: [
      {
        toolName: "get_indicateurs_sans_vi_vc",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question:
      "Quels indicateurs n'ont pas de valeur cible sur le chantier CH-018 ?",
    reason: "VC seule demandée : missing vc",
    expected: [
      {
        toolName: "get_indicateurs_sans_vi_vc",
        input: { chantier_ids: ["CH-018"], missing: "vc" },
      },
    ],
  },
  {
    question: "Quels indicateurs de mes chantiers n'ont pas de VI ?",
    reason: "VI seule demandée : missing vi",
    expected: [
      { toolName: "get_indicateurs_sans_vi_vc", input: { missing: "vi" } },
    ],
  },
  {
    question: "Sur quels territoires l'IND-894 n'a-t-il pas de valeur cible ?",
    reason:
      "indicateur cité : filtre sur cet indicateur, détail par territoire",
    expected: [
      {
        toolName: "get_indicateurs_sans_vi_vc",
        input: { indicateur_ids: ["IND-894"], missing: "vc" },
      },
    ],
  },
  {
    question:
      "La part des locaux raccordables à la fibre a-t-elle une valeur cible partout ?",
    reason:
      "indicateur désigné par son libellé : search_indicateurs pour trouver son identifiant, puis l'outil",
    expected: [
      { toolName: "search_indicateurs" },
      {
        toolName: "get_indicateurs_sans_vi_vc",
        input: { indicateur_ids: ["IND-019"], missing: "vc" },
      },
    ],
  },
  {
    question: "Quels indicateurs ne sont pas à jour sur mes chantiers ?",
    reason: "CAS NÉGATIF : mise à jour → get_indicateurs_non_a_jour seul",
    forbidden: ["get_indicateurs_sans_vi_vc"],
  },
  {
    question: "Quels indicateurs sont en retard sur le CH-018 ?",
    reason:
      "CAS NÉGATIF : retard d'un indicateur = mise à jour → get_indicateurs_non_a_jour seul",
    forbidden: ["get_indicateurs_sans_vi_vc"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_sans_vi_vc",
  cases: CASES,
});
