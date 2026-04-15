import { DashboardPanel } from "./DashboardPanel";

function normalizeNewlines(text: string): string {
  return text.replace(/[⏎↵\u23CE\u21B5]/g, "\n");
}

export const DashboardWidgetParagraph = ({
  contenu,
  variant = "default",
}: {
  contenu: string;
  variant?: "default" | "warning";
}) => (
  <DashboardPanel
    className={
      variant === "warning"
        ? "border-yellow-400 bg-yellow-50"
        : undefined
    }
  >
    <p className="text-sm text-gray-700 whitespace-pre-wrap fr-mb-0">
      {normalizeNewlines(contenu)}
    </p>
  </DashboardPanel>
);
