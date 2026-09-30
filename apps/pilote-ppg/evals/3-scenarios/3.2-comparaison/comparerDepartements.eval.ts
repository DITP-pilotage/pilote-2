import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer Bretagne avec ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Attente stricte, décidée en revue : UN SEUL appel sur REG-53 avec
 * `include_sous_territoires`. Le prompt interdit d'énumérer les
 * sous-territoires ; une énumération échoue « Outils attendus ».
 *
 * « avec ses départements » ne déclenche pas le mot-clé du détecteur, qui
 * attend « et ses départements » : la consigne impérative sur les
 * sous-territoires n'est pas injectée (PIL-1833, point 12).
 *
 * Référence observée : à compléter au premier run.
 */

scenarioEval({
  suite: "Comparer Bretagne avec ses départements",
  group: "comparaison",
  grid: GRIDS.comparaisonSousTerritoires,
  cases: [
    {
      question: "Compare Bretagne avec ses départements",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: { territoire_code: "REG-53", include_sous_territoires: true },
        },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
