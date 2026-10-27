import { scenarioEval } from "../scenarioEval";
import { ENCART_CRITERIA } from "../criteria/encart";
import { COMPARER_TERRITOIRES_CRITERIA } from "./comparerTerritoires.criteria";

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
 * Second run du 2026-09-30 : outils 100 %, forme 96 %, fond 61 % ; REG-84 nommé
 * Auvergne-Rhône-Alpes 2/3.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 96 %, fond
 * 75 % ; échecs : Analyse des écarts 0/9, Territoires du tableau 7/9.
 */

const comparaisonDe = (territoire_codes: string[]) => ({
  toolName: "rediger_comparaison_territoires",
  input: { territoire_codes },
});

scenarioEval({
  suite: "Comparer avec un autre territoire",
  group: "comparaison",
  criteria: [...COMPARER_TERRITOIRES_CRITERIA, ...ENCART_CRITERIA],
  matter: "encart",
  cases: [
    {
      question: "Compare Bretagne avec Pays de la Loire",
      reason: "Deux régions",
      truthScope: { territoires: ["REG-53", "REG-52"] },
      expected: [comparaisonDe(["REG-53", "REG-52"])],
      tableTerritories: ["REG-53", "REG-52"],
    },
    {
      question: "Compare Bretagne avec la région 84",
      reason: "Piège du 84 : REG-84, Auvergne-Rhône-Alpes",
      truthScope: { territoires: ["REG-53", "REG-84"] },
      expected: [comparaisonDe(["REG-53", "REG-84"])],
      tableTerritories: ["REG-53", "REG-84"],
    },
    {
      question: "Compare Bretagne avec 35 - Ille-et-Vilaine",
      reason:
        "Une région face à son département : deux médianes de mailles différentes",
      truthScope: { territoires: ["REG-53", "DEPT-35"] },
      expected: [comparaisonDe(["REG-53", "DEPT-35"])],
      tableTerritories: ["REG-53", "DEPT-35"],
    },
  ],
});
