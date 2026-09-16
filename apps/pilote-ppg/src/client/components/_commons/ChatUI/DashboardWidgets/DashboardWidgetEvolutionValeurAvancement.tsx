import { EvolutionCourbesValeursAvancement } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/EvolutionCourbesValeursAvancement";
import { DashboardPanel } from "./DashboardPanel";

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
    <EvolutionCourbesValeursAvancement
      indicateurId={indicateurId}
      chantierId={chantierId}
      jalon={jalon}
      territoiresSelectionnesCodes={territoireCodes}
    />
  </DashboardPanel>
);
