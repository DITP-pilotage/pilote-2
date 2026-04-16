import { ReactNode } from "react";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

export const DashboardCardShell = ({
  label,
  footer,
  children,
}: {
  label: string;
  footer: string;
  children: ReactNode;
}) => (
  <DashboardPanel className="flex flex-col justify-between">
    <DashboardWidgetTitle segments={[label]} />
    <div className="flex-1 flex items-center justify-center mt-2">
      {children}
    </div>
    <div className="text-xs text-gray-500 mt-2">{footer}</div>
  </DashboardPanel>
);
