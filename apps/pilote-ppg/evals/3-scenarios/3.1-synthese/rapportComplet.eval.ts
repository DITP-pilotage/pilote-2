import { scenarioEval } from "../scenarioEval";
import { RAPPORT_COMPLET_CRITERIA } from "./rapportComplet.criteria";

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
 *
 * Le premier cas attend `synthese_territoire` à la place des trois lectures,
 * sans interdire les primitives : le détour par `get_indicateurs` et
 * `export_rapport` rend une interdiction trop sévère.
 *
 * Le second cas exporte une synthèse déjà faite dans la conversation : c'est
 * l'usage visé par l'export, et le rapport se juge alors contre ce qui a été
 * dit (« Fidèle à la conversation »). Les sections du rapport ne sont plus
 * vérifiées : leur contenu dépend de ce que la conversation a produit.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 92 %, forme 80 %, fond
 * 53 % ; échecs : Fidèle à la conversation 0/3, Export appelé 3/6, Réponse du
 * chat 3/6, Chiffres exacts 4/6, Pas d'opinion 4/6.
 * Run du 2026-10-26, après le passage à `synthese_territoire` : score 80 % ;
 * export appelé 6/6 (le cas 1 n'est plus écrasé par la synthèse) ; échecs :
 * Réponse du chat 1/6, Chiffres exacts 2/6, Fidèle à la conversation 3/6.
 */

const territoire = { territoire_code: "REG-53" };

scenarioEval({
  suite: "Rapport complet (Markdown)",
  group: "synthese",
  criteria: RAPPORT_COMPLET_CRITERIA,
  matter: "rapport",
  cases: [
    {
      question:
        "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [
        { toolName: "synthese_territoire", input: territoire },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-005" } },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-006" } },
        { toolName: "export_rapport", input: { format: "markdown" } },
      ],
    },
    {
      history: ["Fais moi la synthèse du territoire Bretagne"],
      question: "Exporte cette synthèse en rapport au format Markdown",
      reason:
        "Export d'une synthèse faite au tour précédent : le rapport doit la reprendre",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "export_rapport", input: { format: "markdown" } }],
    },
  ],
});
