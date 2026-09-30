import type { ComposeDashboardOutput } from "@/server/albert/tools/composeDashboard";
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";
import type { ObservedToolCall } from "../types";
import type { EvalProfile } from "../world";
import type { MatterKind } from "./grid";
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
    .filter((result) => OUTILS_QUI_MASQUENT.includes(result.toolName))
    .flatMap((result) =>
      (
        (result.output as { resultats?: { territoire_code: string }[] })
          .resultats ?? []
      ).map((resultat) => resultat.territoire_code),
    )
    .filter((code) => !userTerritories.includes(code));
  return [...new Set(codes)].sort();
}
