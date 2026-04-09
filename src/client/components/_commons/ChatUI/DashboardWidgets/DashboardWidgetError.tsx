export const DashboardWidgetError = ({ error }: { error: Error }) => (
  <div className="h-full rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
    {error.message}
  </div>
);
