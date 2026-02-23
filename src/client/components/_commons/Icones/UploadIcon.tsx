export const UploadIcon = ({
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
      d="M3 19H21V21H3V19ZM13 10V18H11V10H4L12 2L20 10H13Z"
      fill={fill}
    />
  </svg>
);
