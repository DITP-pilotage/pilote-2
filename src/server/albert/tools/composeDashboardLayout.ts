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
  widget_taux_avancement_territoire: 1,
  widget_mediane_avancement_territoire: 1,
  widget_nombre_chantiers_en_retard: 1,
  widget_nombre_chantiers_en_difficulte: 1,
  widget_valeurs_remarquables_avancement: 2,
  widget_tableau_indicateurs_chantier: 4,
  widget_liste_chantiers_en_retard: 2,
  widget_liste_chantiers_en_difficulte: 2,
  widget_cartographie_taux_avancement: 2,
  widget_cartographie_meteo: 2,
  widget_cartographie_propositions_valeur_avancement: 2,
  widget_titre_section: 4,
};
