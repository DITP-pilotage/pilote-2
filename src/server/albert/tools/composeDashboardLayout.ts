export type WidgetType =
  | "kpi_card"
  | "tableau_indicateurs"
  | "liste_chantiers_alerte"
  | "texte_section"
  | "filler";

export type RowGroup = "kpi" | "list" | "wide" | "section" | "spacer";

export const DEFAULT_WIDTHS: Record<WidgetType, number> = {
  kpi_card: 3,
  tableau_indicateurs: 12,
  liste_chantiers_alerte: 6,
  texte_section: 12,
  filler: 6,
};

export const ROW_GROUPS: Record<WidgetType, RowGroup> = {
  kpi_card: "kpi",
  tableau_indicateurs: "wide",
  liste_chantiers_alerte: "list",
  texte_section: "section",
  filler: "spacer",
};
