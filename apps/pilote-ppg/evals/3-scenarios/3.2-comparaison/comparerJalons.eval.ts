import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer les taux d'avancement entre le jalon 2025 et un autre
 * jalon » (DITP, à compléter) : « Compare les taux d'avancement de Bretagne
 * entre le jalon 2025 et ».
 *
 * 2024 est semé ; 2023 ne l'est pas : Albert doit dire que les données ne
 * sont pas disponibles, sans inventer. « l'année précédente » vérifie la
 * résolution d'un jalon relatif au jalon courant.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 100 %, fond 96 %.
 * 2023 sans données est dit, sans invention (3/3). Sur « l'année
 * précédente », l'évolution en points manque dans un essai sur trois.
 * Second run du 2026-09-30 : outils 100 %, forme 100 %, fond 100 %.
 */

const tauxBretagne = (jalon: number) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code: "REG-53", jalon },
});

const MESSAGE = (autre: string) =>
  `Compare les taux d'avancement de Bretagne entre le jalon 2025 et ${autre}`;

scenarioEval({
  suite: "Comparer les taux d'avancement entre le jalon 2025 et un autre jalon",
  group: "comparaison",
  grid: GRIDS.comparaisonJalons,
  cases: [
    {
      question: MESSAGE("2024"),
      reason: "Jalon semé",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2024] },
      expected: [tauxBretagne(2025), tauxBretagne(2024)],
    },
    {
      question: MESSAGE("l'année précédente"),
      reason: "Jalon relatif : 2024",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2024] },
      expected: [tauxBretagne(2025), tauxBretagne(2024)],
    },
    {
      question: MESSAGE("2023"),
      reason: "Aucune donnée en 2023 : à dire, sans inventer",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2023] },
      expected: [tauxBretagne(2025), tauxBretagne(2023)],
    },
  ],
});
