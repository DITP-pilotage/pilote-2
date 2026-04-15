import { DashboardPanel } from "./DashboardPanel";

function normalizeNewlines(text: string): string {
  return text.replace(/[⏎↵\u23CE\u21B5]/g, "\n");
}

export const DashboardWidgetParagraph = ({ contenu }: { contenu: string }) => (
  <DashboardPanel>
    <p className="text-sm text-gray-700 whitespace-pre-wrap fr-mb-0">
      {normalizeNewlines(contenu)}
    </p>
  </DashboardPanel>
);
