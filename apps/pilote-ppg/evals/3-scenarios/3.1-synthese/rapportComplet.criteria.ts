import { judged, mechanical, withBase } from "../criterion";
import { checkExactAnswer, checkNoLink } from "../mechanicalChecks";

/** Les critères du scénario « Rapport complet ». */
export const RAPPORT_COMPLET_CRITERIA = withBase({
  criteria: [
    mechanical({
      id: "Export appelé",
      rule: "export_rapport : collecte les données, puis exporte",
      check: (evidence) => {
        const call = evidence.toolCalls.find(
          (toolCall) => toolCall.toolName === "export_rapport",
        );
        if (!call) return { ok: false, detail: "export non appelé" };
        const format = (call.input as { format?: string }).format ?? "markdown";
        return format === "markdown"
          ? { ok: true, detail: "export markdown" }
          : { ok: false, detail: `format ${format} au lieu de markdown` };
      },
    }),
    mechanical({
      id: "Réponse du chat",
      rule: "export_rapport : réponds « Votre rapport est disponible au téléchargement. », sans lien",
      check: (evidence) => {
        const lien = checkNoLink({ text: evidence.answer });
        return lien.ok
          ? checkExactAnswer({
              text: evidence.answer,
              expected: "Votre rapport est disponible au téléchargement.",
            })
          : lien;
      },
    }),
    judged({
      id: "Fidèle à la conversation",
      rule: "export_rapport : le rapport reprend les données de la conversation",
      instruction:
        "Compare le rapport exporté à la CONVERSATION PRÉCÉDENTE. Chaque chiffre, chantier ou constat du rapport y a été donné, ou figure dans les DONNÉES REÇUES ; et les éléments principaux de la synthèse rendue par l'assistant dans la CONVERSATION PRÉCÉDENTE (taux, CHAQUE chantier cité, constats) se retrouvent dans le rapport. La phrase du chat qui annonce le rapport n'est pas cette synthèse. Un élément qui contredit la conversation, ou un chantier de la synthèse absent du rapport, est non conforme. Sans rapport exporté, non conforme.",
      applicable: (evidence) => evidence.conversation.length > 0,
    }),
  ],
});
