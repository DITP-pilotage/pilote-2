import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Tableau de bord du territoire » (DITP administrateur, envoyé),
 * avec le message COMPLET de l'interface, pas la version abrégée du spike.
 *
 * La matière est la structure rendue par `create_dashboard`. Les données des
 * widgets sont résolues au rendu : pas d'hallucination de chiffre possible,
 * seul le choix des widgets est jugé. La « pleine largeur » relève du code de
 * mise en page, elle n'est pas notée.
 *
 * Référence observée : à compléter au premier run.
 */

scenarioEval({
  suite: "Tableau de bord du territoire",
  group: "synthese",
  grid: GRIDS.dashboard,
  cases: [
    {
      question:
        "Compose un tableau de bord pour Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_chantiers",
          input: { territoire_code: "REG-53", view: "en_retard" },
        },
        {
          toolName: "get_chantiers",
          input: { territoire_code: "REG-53", view: "en_difficulte" },
        },
        {
          toolName: "create_dashboard",
          input: { territoire_codes: ["REG-53"] },
        },
      ],
    },
  ],
});
