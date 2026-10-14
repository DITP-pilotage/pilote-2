export const DashboardWidgetTitreSection = ({
  titre,
  description,
}: {
  titre: string;
  description: string | undefined;
}) => (
  <div className="h-full py-2 mt-3">
    <h4 className="text-base font-semibold text-gray-900 mb-0">{titre}</h4>
    {description ? (
      <p className="text-sm text-gray-600 mt-1 mb-0">{description}</p>
    ) : null}
  </div>
);
