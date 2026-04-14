import { ReactNode } from "react";
import { DashboardPanel } from "./DashboardPanel";

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
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="flex-1 flex items-center justify-center mt-2">
      {children}
    </div>
    <div className="text-xs text-gray-500 mt-2">{footer}</div>
  </DashboardPanel>
);
