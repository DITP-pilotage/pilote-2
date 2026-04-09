import { WidgetCartographieMeteo } from "@/components/_commons/Widget/WidgetCartographieMeteo/WidgetCartographieMeteo";
import type { MailleInterne } from "@/server/domain/maille/Maille.interface";

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
  <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
    <WidgetCartographieMeteo
      chantierId={chantierId}
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
    />
  </div>
);
