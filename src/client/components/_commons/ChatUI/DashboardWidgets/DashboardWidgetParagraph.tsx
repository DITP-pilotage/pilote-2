import { clsxm } from "@/utils/clsxm";
import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetParagraph = ({
  contenu,
  variant = "default",
}: {
  contenu: string[];
  variant?: "default" | "warning";
}) => (
  <DashboardPanel
    className={clsxm({
      "border-yellow-400 bg-yellow-50": variant === "warning",
    })}
  >
    <div className="space-y-2">
      {contenu.map((part, index) => (
        <p key={index} className="text-sm text-gray-700 fr-mb-0">
          {part}
        </p>
      ))}
    </div>
  </DashboardPanel>
);
