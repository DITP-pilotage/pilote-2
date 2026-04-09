import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";

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
  <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
    <WidgetCartographieTA
      mode="chantiers"
      chantierIds={chantierIds}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </div>
);
