export const CodeViewIcon = ({
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
      d="M16.95 8.46405L18.364 7.05005L23.314 12L18.364 16.95L16.95 15.536L20.485 12L16.95 8.46405ZM7.05004 8.46405L3.51504 12L7.05004 15.536L5.63604 16.95L0.686035 12L5.63604 7.05005L7.05004 8.46405Z"
      fill={fill}
    />
  </svg>
);
