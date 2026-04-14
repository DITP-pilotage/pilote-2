import { clsxm } from "@/utils/clsxm";

export const DashboardWidgetTitle = ({
  segments,
  className,
}: {
  segments: string[];
  className?: string;
}) => (
  <div
    className={clsxm(
      "text-xs uppercase tracking-wide text-gray-500",
      className,
    )}
  >
    {segments.join(" · ")}
  </div>
);
