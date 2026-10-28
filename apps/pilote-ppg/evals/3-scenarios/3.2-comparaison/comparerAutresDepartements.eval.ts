import { scenarioEval } from "../scenarioEval";
import { ENCART_CRITERIA } from "../criteria/encart";
import { COMPARER_DEPARTEMENTS_CRITERIA } from "./comparerDepartements.criteria";

/**
 * Scénario « Comparer avec les autres départements de Bretagne » (DITP,
 * envoyé depuis l'Ille-et-Vilaine, seul scénario à territoire courant
 * départemental). Le message porte le libellé affiché : « 35 -
 * Ille-et-Vilaine ».
 *
 * Deux chemins légitimes : un appel sur REG-53 avec les sous-territoires, ou
 * quatre appels départementaux. Le scorer d'outils ne sait pas exprimer
 * « l'un ou l'autre » : il n'exige que l'outil, et « Territoires du tableau »
 * vérifie le résultat. La ligne de la région n'est pas pénalisée.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 100 %, fond 67 %.
 * Les quatre départements sont dans le tableau ; analyse des écarts 1/3.
 * Second run du 2026-09-30 : outils 100 %, forme 100 %, fond 67 %.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 100 %, fond
 * 73 % ; échecs : Analyse des écarts 0/3, Position face à la médiane 2/3.
 */

scenarioEval({
  suite: "Comparer avec les autres départements de Bretagne",
  group: "comparaison",
  criteria: [...COMPARER_DEPARTEMENTS_CRITERIA, ...ENCART_CRITERIA],
  matter: "encart",
  currentTerritory: "DEPT-35",
  cases: [
    {
      question:
        "Compare 35 - Ille-et-Vilaine avec les autres départements de Bretagne",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [{ toolName: "rediger_comparaison_territoires" }],
      tableTerritories: ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
