export type WidgetType =
  | "widget_taux_avancement_territoire"
  | "widget_mediane_avancement_territoire"
  | "widget_nombre_chantiers_en_retard"
  | "widget_nombre_chantiers_en_difficulte"
  | "widget_valeurs_remarquables_avancement"
  | "widget_tableau_indicateurs_chantier"
  | "widget_liste_chantiers_en_retard"
  | "widget_liste_chantiers_en_difficulte"
  | "widget_cartographie_taux_avancement"
  | "widget_cartographie_meteo"
  | "widget_cartographie_propositions_valeur_avancement"
  | "widget_titre_section";

export const DEFAULT_WIDTHS: Record<WidgetType, number> = {
  widget_taux_avancement_territoire: 3,
  widget_mediane_avancement_territoire: 3,
  widget_nombre_chantiers_en_retard: 3,
  widget_nombre_chantiers_en_difficulte: 3,
  widget_valeurs_remarquables_avancement: 6,
  widget_tableau_indicateurs_chantier: 12,
  widget_liste_chantiers_en_retard: 6,
  widget_liste_chantiers_en_difficulte: 6,
  widget_cartographie_taux_avancement: 6,
  widget_cartographie_meteo: 6,
  widget_cartographie_propositions_valeur_avancement: 6,
  widget_titre_section: 12,
};
