import { EvolutionCourbesTauxAvancement } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/EvolutionCourbesTauxAvancement";
import { DashboardPanel } from "./DashboardPanel";

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
    <EvolutionCourbesTauxAvancement
      indicateurId={indicateurId}
      chantierId={chantierId}
      jalon={jalon}
      territoiresSelectionnesCodes={territoireCodes}
    />
  </DashboardPanel>
);
