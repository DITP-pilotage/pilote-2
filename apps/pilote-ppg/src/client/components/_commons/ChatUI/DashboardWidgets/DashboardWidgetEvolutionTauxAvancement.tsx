import { EvolutionCourbesTauxAvancement } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/EvolutionCourbesTauxAvancement";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

export const DashboardWidgetEvolutionTauxAvancement = ({
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
    <DashboardWidgetTitle segments={["Taux d'avancement"]} className="mb-3" />
    <EvolutionCourbesTauxAvancement
      indicateurId={indicateurId}
      chantierId={chantierId}
      jalon={jalon}
      territoiresSelectionnesCodes={territoireCodes}
    />
  </DashboardPanel>
);
