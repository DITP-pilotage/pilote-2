import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetCartographieTauxAvancement = ({
  maille,
  territoireCode,
  jalon,
  chantierIds,
}: {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
  chantierIds: string[];
}) => (
  <DashboardPanel>
    <WidgetCartographieTA
      mode="chantiers"
      chantierIds={chantierIds}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </DashboardPanel>
);
