export const BuildingLineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M14 3a1 1 0 0 1 1 1v15h4v-8h-2V9h3a1 1 0 0 1 1 1v9h2v2H1v-2h2V4a1 1 0 0 1 1-1h10Zm-1 2H5v14h8V5Zm-2 6v2H7v-2h4Zm0-4v2H7V7h4Z"
      fill={fill}
    />
  </svg>
);
