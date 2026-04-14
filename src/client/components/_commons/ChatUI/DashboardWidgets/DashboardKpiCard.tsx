import { DashboardCardShell } from "./DashboardCardShell";

export const DashboardKpiCard = ({
  label,
  value,
  footer,
}: {
  label: string;
  value: string;
  footer: string;
}) => (
  <DashboardCardShell label={label} footer={footer}>
    <div className="text-3xl font-semibold text-gray-900">{value}</div>
  </DashboardCardShell>
);
