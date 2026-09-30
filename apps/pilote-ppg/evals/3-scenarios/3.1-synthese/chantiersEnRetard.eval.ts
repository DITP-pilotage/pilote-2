import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Chantiers en retard et leurs indicateurs » (DITP et
 * coordinateur, envoyé, même message).
 *
 * Les instructions de `get_indicateurs` disent « pour afficher les
 * indicateurs, utilise create_dashboard », outil non chargé faute de mot-clé
 * (PIL-1833, point 7). « Valeurs des indicateurs » mesure si l'agent donne
 * quand même les valeurs.
 *
 * Référence observée : à compléter au premier run.
 */

const MESSAGE =
  "Analyse les chantiers en retard sur Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.";

const OUTILS = [
  {
    toolName: "get_chantiers",
    input: { territoire_code: "REG-53", view: "en_retard" },
  },
  {
    toolName: "get_indicateurs",
    input: { chantier_id: "CH-005", territoire_code: "REG-53" },
  },
];

const SCOPE = { territoires: ["REG-53"], indicateurs: true };

scenarioEval({
  suite: "Chantiers en retard et leurs indicateurs",
  group: "synthese",
  grid: GRIDS.chantiersEnRetard,
  cases: [
    {
      question: MESSAGE,
      reason: "DITP",
      profile: "ditp",
      truthScope: SCOPE,
      expected: OUTILS,
    },
    {
      question: MESSAGE,
      reason: "Coordinateur",
      profile: "coordinateur",
      truthScope: SCOPE,
      expected: OUTILS,
    },
  ],
});
