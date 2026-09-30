import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Rapport complet (Markdown) » (DITP administrateur, envoyé).
 *
 * La matière jugée est le contenu passé à `export_rapport`. Résultat connu du
 * niveau 2 : 0/3, le workflow de synthèse écrase l'export (PIL-1833, point
 * 14). Sans export, tous les critères du rapport tombent : c'est acté.
 *
 * Référence observée le 2026-09-30 : outils 83 %, forme 53 %, fond 33 %.
 * `export_rapport` n'est jamais appelé (0/3) : le rapport est rédigé dans
 * le chat, comme au niveau 2 (PIL-1833, point 14).
 * Second run du 2026-09-30 : outils 83 %, forme 60 %, fond 33 % ; export
 * toujours 0/3.
 */

const territoire = { territoire_code: "REG-53" };

scenarioEval({
  suite: "Rapport complet (Markdown)",
  group: "synthese",
  grid: GRIDS.rapport,
  cases: [
    {
      question:
        "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [
        { toolName: "get_taux_avancement_territoire", input: territoire },
        {
          toolName: "get_chantiers",
          input: { ...territoire, view: "en_retard" },
        },
        {
          toolName: "get_chantiers",
          input: { ...territoire, view: "en_difficulte" },
        },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-005" } },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-006" } },
        { toolName: "export_rapport", input: { format: "markdown" } },
      ],
    },
  ],
});
