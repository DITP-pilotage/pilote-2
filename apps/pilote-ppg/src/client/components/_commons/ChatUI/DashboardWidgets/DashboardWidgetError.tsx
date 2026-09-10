export const DashboardWidgetError = ({ error }: { error: Error }) => (
  <div className="h-full border border-error bg-dsfr-warning-950 p-3 text-xs text-error">
    {error.message}
  </div>
);
