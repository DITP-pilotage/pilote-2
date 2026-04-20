import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetCartographiePropositionsValeurAvancement = ({
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
    <WidgetCartographiePVA
      mode="chantier"
      chantierId={chantierId}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </DashboardPanel>
);
