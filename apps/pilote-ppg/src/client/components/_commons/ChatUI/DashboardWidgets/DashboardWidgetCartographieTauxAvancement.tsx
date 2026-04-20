import type { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { WidgetCartographieTAComparaison } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/WidgetCartographieTAComparaison";
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
    <WidgetCartographieTAComparaison
      mode="chantiers"
      chantierIds={chantierIds}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </DashboardPanel>
);
