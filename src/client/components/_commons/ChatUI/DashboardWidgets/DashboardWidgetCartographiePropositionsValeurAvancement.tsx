import { WidgetCartographiePVA } from "@/components/_commons/Widget/WidgetCartographiePVA/WidgetCartographiePVA";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";

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
  <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
    <WidgetCartographiePVA
      mode="chantier"
      chantierId={chantierId}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </div>
);
