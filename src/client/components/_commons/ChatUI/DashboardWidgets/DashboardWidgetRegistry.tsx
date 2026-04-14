import type { WidgetDefinition } from "@/server/albert/tools/composeDashboard";
import { DashboardWidgetTauxAvancementTerritoire } from "./DashboardWidgetTauxAvancementTerritoire";
import { DashboardWidgetMedianeAvancementTerritoire } from "./DashboardWidgetMedianeAvancementTerritoire";
import { DashboardWidgetNombreChantiersEnRetard } from "./DashboardWidgetNombreChantiersEnRetard";
import { DashboardWidgetNombreChantiersEnDifficulte } from "./DashboardWidgetNombreChantiersEnDifficulte";
import { DashboardWidgetValeursRemarquablesAvancement } from "./DashboardWidgetValeursRemarquablesAvancement";
import { DashboardWidgetTableauIndicateursChantier } from "./DashboardWidgetTableauIndicateursChantier";
import { DashboardWidgetListeChantiersEnRetard } from "./DashboardWidgetListeChantiersEnRetard";
import { DashboardWidgetListeChantiersEnDifficulte } from "./DashboardWidgetListeChantiersEnDifficulte";
import { DashboardWidgetCartographieTauxAvancement } from "./DashboardWidgetCartographieTauxAvancement";
import { DashboardWidgetCartographieMeteo } from "./DashboardWidgetCartographieMeteo";
import { DashboardWidgetCartographiePropositionsValeurAvancement } from "./DashboardWidgetCartographiePropositionsValeurAvancement";
import { DashboardWidgetTitreSection } from "./DashboardWidgetTitreSection";

export const DashboardWidgetRegistry = ({
  widget,
}: {
  widget: WidgetDefinition;
}) => {
  switch (widget.type) {
    case "widget_taux_avancement_territoire":
      return (
        <DashboardWidgetTauxAvancementTerritoire
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_mediane_avancement_territoire":
      return (
        <DashboardWidgetMedianeAvancementTerritoire
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_nombre_chantiers_en_retard":
      return (
        <DashboardWidgetNombreChantiersEnRetard
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_nombre_chantiers_en_difficulte":
      return (
        <DashboardWidgetNombreChantiersEnDifficulte
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_valeurs_remarquables_avancement":
      return (
        <DashboardWidgetValeursRemarquablesAvancement
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_tableau_indicateurs_chantier":
      return (
        <DashboardWidgetTableauIndicateursChantier
          chantierId={widget.chantier_id}
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_liste_chantiers_en_retard":
      return (
        <DashboardWidgetListeChantiersEnRetard
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_liste_chantiers_en_difficulte":
      return (
        <DashboardWidgetListeChantiersEnDifficulte
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
        />
      );
    case "widget_cartographie_taux_avancement":
      return (
        <DashboardWidgetCartographieTauxAvancement
          maille={widget.maille}
          territoireCode={widget.territoire_code}
          jalon={widget.jalon}
          chantierIds={widget.chantier_ids}
        />
      );
    case "widget_cartographie_meteo":
      return (
        <DashboardWidgetCartographieMeteo
          maille={widget.maille}
          territoireCode={widget.territoire_code}
          chantierId={widget.chantier_id}
          jalon={widget.jalon}
        />
      );
    case "widget_cartographie_propositions_valeur_avancement":
      return (
        <DashboardWidgetCartographiePropositionsValeurAvancement
          maille={widget.maille}
          territoireCode={widget.territoire_code}
          chantierId={widget.chantier_id}
          jalon={widget.jalon}
        />
      );
    case "widget_titre_section":
      return (
        <DashboardWidgetTitreSection
          titre={widget.titre}
          description={widget.description}
        />
      );
  }
};
