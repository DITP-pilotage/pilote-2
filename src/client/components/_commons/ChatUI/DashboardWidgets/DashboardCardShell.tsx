import { ReactNode } from "react";

export const DashboardCardShell = ({
  label,
  footer,
  children,
}: {
  label: string;
  footer: string;
  children: ReactNode;
}) => (
  <div className="h-full rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="flex-1 flex items-center justify-center mt-2">
      {children}
    </div>
    <div className="text-xs text-gray-500 mt-2">{footer}</div>
  </div>
);
