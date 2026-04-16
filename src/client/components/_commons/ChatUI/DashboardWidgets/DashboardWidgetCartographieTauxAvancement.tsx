import type { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTAComparaison } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/WidgetCartographieTAComparaison";
import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetCartographieTauxAvancement = ({
  maille,
  territoireCode,
  jalon,
}: {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
}) => (
  <DashboardPanel>
    <WidgetCartographieTAComparaison
      mode="chantiers"
      chantierIds={[]}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </DashboardPanel>
);
