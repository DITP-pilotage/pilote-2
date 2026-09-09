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
      "text-[11px] font-bold uppercase leading-4 tracking-wide text-dsfr-mention-grey",
      className,
    )}
  >
    {segments.join(" · ")}
  </div>
);
