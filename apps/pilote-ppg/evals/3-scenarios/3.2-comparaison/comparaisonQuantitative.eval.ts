import { scenarioEval } from "../scenarioEval";
import { COMPARAISON_QUANTITATIVE_CRITERIA } from "./comparaisonQuantitative.criteria";

/**
 * Scénario « Comparaison quantitative des territoires » (coordinateur, à
 * compléter) : « Compare les taux d'avancement de Bretagne avec ».
 *
 * « Restriction signalée » est retiré de la grille : seul le taux est
 * demandé, et il n'est jamais masqué.
 *
 * « le département 84 » est la moitié coordinateur du piège du 84 : DEPT-84
 * est le Vaucluse.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 93 %, fond 61 %.
 * Analyse des écarts absente sur deux cas (0/3). DEPT-84 est nommé
 * Vaucluse dans 2 essais sur 3.
 * Second run du 2026-09-30 : outils 100 %, forme 82 %, fond 50 % ; plus aucun
 * tableau face aux Pays de la Loire (0/3).
 */

const tauxDe = (territoire_code: string) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code },
});

const MESSAGE = (autre: string) =>
  `Compare les taux d'avancement de Bretagne avec ${autre}`;

scenarioEval({
  suite: "Comparaison quantitative des territoires",
  group: "comparaison",
  criteria: COMPARAISON_QUANTITATIVE_CRITERIA,
  profile: "coordinateur",
  cases: [
    {
      question: MESSAGE("Pays de la Loire"),
      reason: "Région hors périmètre : le taux reste visible",
      truthScope: { territoires: ["REG-53", "REG-52"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-52")],
      tableTerritories: ["REG-53", "REG-52"],
    },
    {
      question: MESSAGE("le département 84"),
      reason: "Piège du 84 : DEPT-84, Vaucluse",
      truthScope: { territoires: ["REG-53", "DEPT-84"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-84")],
      tableTerritories: ["REG-53", "DEPT-84"],
    },
    {
      question: MESSAGE("Finistère"),
      reason: "Département du périmètre",
      truthScope: { territoires: ["REG-53", "DEPT-29"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-29")],
      tableTerritories: ["REG-53", "DEPT-29"],
    },
  ],
});
