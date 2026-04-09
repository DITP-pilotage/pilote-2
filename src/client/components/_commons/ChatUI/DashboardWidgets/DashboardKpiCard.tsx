export const DashboardKpiCard = ({
  label,
  value,
  footer,
}: {
  label: string;
  value: string;
  footer: string;
}) => (
  <div className="h-full rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-3xl font-semibold text-gray-900 mt-2">{value}</div>
    <div className="text-xs text-gray-500 mt-2">{footer}</div>
  </div>
);

export const formatPourcentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}%`;
};
