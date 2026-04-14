import { WidgetCartographieMeteo } from "@/components/_commons/Widget/WidgetCartographieMeteo/WidgetCartographieMeteo";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetCartographieMeteo = ({
  maille,
  territoireCode,
  chantierId,
  jalon,
}: {
  maille: MailleInterne;
  territoireCode: string;
  chantierId: string;
  jalon: number;
}) => (
  <DashboardPanel>
    <WidgetCartographieMeteo
      chantierId={chantierId}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </DashboardPanel>
);
