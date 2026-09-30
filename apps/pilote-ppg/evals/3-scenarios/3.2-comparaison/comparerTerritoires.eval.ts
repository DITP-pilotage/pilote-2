import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer avec un autre territoire » (DITP, à compléter) :
 * « Compare Bretagne avec ».
 *
 * Le gabarit comparaison n'est pas chargé (aucun mot-clé de synthèse) : la
 * grille juge ce qu'Albert reçoit. Le périmètre d'une « comparaison » n'étant
 * défini nulle part, seuls les taux sont exigés ; les chantiers en plus ne
 * sont pas pénalisés.
 *
 * « la région 84 » est la moitié DITP du piège du 84 : REG-84 est
 * Auvergne-Rhône-Alpes (au niveau 2, « le 84 » était présenté comme le Grand
 * Est).
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 93 %, fond 50 %.
 * Aucune analyse des écarts (0/3 sur chaque cas) : le gabarit comparaison
 * n'étant pas chargé, Albert s'en tient au tableau. REG-84 n'est jamais
 * nommé Auvergne-Rhône-Alpes (0/3), seulement « la région 84 ».
 */

const tauxDe = (territoire_code: string) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code },
});

scenarioEval({
  suite: "Comparer avec un autre territoire",
  group: "comparaison",
  grid: GRIDS.comparaisonTerritoires,
  cases: [
    {
      question: "Compare Bretagne avec Pays de la Loire",
      reason: "Deux régions",
      truthScope: { territoires: ["REG-53", "REG-52"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-52")],
      tableTerritories: ["REG-53", "REG-52"],
    },
    {
      question: "Compare Bretagne avec la région 84",
      reason: "Piège du 84 : REG-84, Auvergne-Rhône-Alpes",
      truthScope: { territoires: ["REG-53", "REG-84"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-84")],
      tableTerritories: ["REG-53", "REG-84"],
    },
    {
      question: "Compare Bretagne avec 35 - Ille-et-Vilaine",
      reason:
        "Une région face à son département : deux médianes de mailles différentes",
      truthScope: { territoires: ["REG-53", "DEPT-35"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-35")],
      tableTerritories: ["REG-53", "DEPT-35"],
    },
  ],
});
