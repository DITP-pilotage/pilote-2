export const DownloadIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 19H21V21H3V19ZM13 9H20L12 17L4 9H11V1H13V9Z"
      fill={fill}
    />
  </svg>
);
