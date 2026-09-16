import { EvolutionCourbesValeursAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/EvolutionCourbesValeursAvancement";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

export const DashboardWidgetEvolutionValeurAvancement = ({
  indicateurId,
  chantierId,
  territoireCodes,
  jalon,
}: {
  indicateurId: string;
  chantierId: string;
  territoireCodes: string[];
  jalon: number;
}) => (
  <DashboardPanel>
    <DashboardWidgetTitle
      segments={["Valeur d'avancement"]}
      className="mb-3"
    />
    <EvolutionCourbesValeursAvancement
      indicateurId={indicateurId}
      chantierId={chantierId}
      jalon={jalon}
      territoiresSelectionnesCodes={territoireCodes}
    />
  </DashboardPanel>
);
