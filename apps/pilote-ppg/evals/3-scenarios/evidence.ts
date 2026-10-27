import type { ComposeDashboardOutput } from "@/server/albert/tools/composeDashboard";
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";
import type { ObservedToolCall } from "../types";
import type { EvalProfile } from "../world";
import type { GroundTruth } from "./truth";

/**
 * Tout ce qu'un critère peut regarder, qu'il soit mécanique ou jugé. Les
 * suites le construisent depuis un tour d'agent ; la calibration l'écrit à la
 * main. Un critère ne voit jamais le tour lui-même : la calibration peut donc
 * lui soumettre des réponses fabriquées.
 */
export type Evidence = {
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  /** Texte de la réponse dans le chat. */
  answer: string;
  /** Ce que lit le juge : texte, rapport rendu, ou dashboard décrit + texte. */
  matter: string;
  dashboard: ComposeDashboardOutput | null;
  toolCalls: ObservedToolCall[];
  /** Résultats d'outils du tour : seule source légitime de chiffres. */
  toolResults: { toolName: string; output: unknown }[];
  /** Territoires hors périmètre dont un outil a rendu des champs masqués. */
  maskedTerritories: string[];
  truth: GroundTruth;
  /** Codes des territoires que le tableau doit contenir, pour les comparaisons. */
  tableTerritories: string[];
  /**
   * Les tours qui précèdent la demande, dans l'ordre : un rapport se juge
   * contre la conversation qu'il reprend. Vide pour un tour isolé.
   */
  conversation: { question: string; answer: string }[];
};

/**
 * Ce que le scénario livre : une réponse dans le chat, un rapport exporté, ou
 * un tableau de bord composé.
 */
export type MatterKind = "text" | "dashboard" | "rapport" | "encart";

export const OUTILS_ENCART = [
  "rediger_synthese_territoire",
  "rediger_comparaison_territoires",
];

type SortieEncart = {
  markdown: string;
  acces_refuse?: true;
  donnees?: {
    chantiers_en_retard: { resultats: { territoire_code: string }[] };
    chantiers_en_difficulte: { resultats: { territoire_code: string }[] };
  };
};

type ToolResult = { toolName: string; input: unknown; output: unknown };

function describeDashboard(dashboard: ComposeDashboardOutput): string {
  return [
    `TABLEAU DE BORD « ${dashboard.titre} »`,
    ...dashboard.containers.flatMap((container, index) => [
      `Section ${index + 1} :`,
      ...container.widgets.map((widget) => {
        const { type, ...rest } = widget;
        return `- ${type} ${JSON.stringify(rest)}`;
      }),
    ]),
  ].join("\n");
}

/**
 * Ce que le juge lit. Quand le livrable est un artefact, le texte du chat n'en
 * est qu'un accompagnement : le juger à sa place noterait une phrase
 * d'annonce, c'était le défaut du juge du spike. Quand l'artefact manque, la
 * matière le dit en tête, et les critères du livrable tombent.
 */
export function extractMatter({
  kind,
  text,
  toolCalls,
  toolResults,
}: {
  kind: MatterKind;
  text: string;
  toolCalls: ObservedToolCall[];
  toolResults: ToolResult[];
}): { matter: string; dashboard: ComposeDashboardOutput | null } {
  if (kind === "rapport") {
    const exportCall = toolCalls.find(
      (call) => call.toolName === "export_rapport",
    );
    const rapport = exportCall
      ? `RAPPORT EXPORTÉ :\n${buildRapportMarkdown(
          exportCall.input as Parameters<typeof buildRapportMarkdown>[0],
        )}`
      : "AUCUN RAPPORT EXPORTÉ : l'assistant n'a pas appelé l'outil d'export.";
    return {
      matter: `${rapport}\n\nRÉPONSE DU CHAT :\n${text}`,
      dashboard: null,
    };
  }

  if (kind === "dashboard") {
    const result = toolResults.find(
      (toolResult) => toolResult.toolName === "create_dashboard",
    );
    const dashboard =
      (result?.output as ComposeDashboardOutput | undefined) ?? null;
    const description = dashboard
      ? describeDashboard(dashboard)
      : "AUCUN TABLEAU DE BORD COMPOSÉ : l'assistant n'a pas appelé l'outil de dashboard.";
    return {
      matter: `${description}\n\nTEXTE D'ACCOMPAGNEMENT :\n${text}`,
      dashboard,
    };
  }

  if (kind === "encart") {
    const encarts = toolResults
      .filter((toolResult) => OUTILS_ENCART.includes(toolResult.toolName))
      .map((toolResult) => toolResult.output as SortieEncart)
      .filter((sortie) => !sortie.acces_refuse);
    const contenu =
      encarts.length > 0
        ? `ENCART RÉDIGÉ :\n${encarts.map((sortie) => sortie.markdown).join("\n\n")}`
        : "AUCUN ENCART RÉDIGÉ : l'assistant n'a pas appelé l'outil d'encart.";
    return {
      matter: `${contenu}\n\nTEXTE D'ACCOMPAGNEMENT :\n${text}`,
      dashboard: null,
    };
  }

  return { matter: text, dashboard: null };
}

/**
 * `get_taux_avancement_territoire` ne masque rien : le taux est toujours
 * visible. Seuls ces deux outils rendent des champs qualitatifs à `null` hors
 * du périmètre de l'utilisateur.
 */
const OUTILS_QUI_MASQUENT = ["get_chantiers", "get_chantier_commentaires"];

export function maskedTerritories({
  toolResults,
  userTerritories,
}: {
  toolResults: ToolResult[];
  userTerritories: string[];
}): string[] {
  const codes = toolResults
    .flatMap((result) => {
      if (OUTILS_QUI_MASQUENT.includes(result.toolName)) {
        return (
          (result.output as { resultats?: { territoire_code: string }[] })
            .resultats ?? []
        ).map((resultat) => resultat.territoire_code);
      }
      // Les outils d'encart lisent les chantiers comme get_chantiers
      const donnees = OUTILS_ENCART.includes(result.toolName)
        ? (result.output as SortieEncart).donnees
        : undefined;
      return donnees
        ? [
            ...donnees.chantiers_en_retard.resultats,
            ...donnees.chantiers_en_difficulte.resultats,
          ].map((resultat) => resultat.territoire_code)
        : [];
    })
    .filter((code) => !userTerritories.includes(code));
  return [...new Set(codes)].sort();
}
