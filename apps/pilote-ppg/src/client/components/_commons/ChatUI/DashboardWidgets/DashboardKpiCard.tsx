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
    <div className="text-[28px] font-bold leading-8 text-dsfr-grey-50">
      {value}
    </div>
  </DashboardCardShell>
);
