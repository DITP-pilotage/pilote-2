import { DashboardPanel } from "./DashboardPanel";

export const DashboardWidgetParagraph = ({
  contenu,
}: {
  contenu: string[];
}) => (
  <DashboardPanel>
    <div className="space-y-2">
      {contenu.map((part, index) => (
        <p
          key={index}
          className="whitespace-pre-line text-sm text-gray-700 last:mb-0"
        >
          {part}
        </p>
      ))}
    </div>
  </DashboardPanel>
);
