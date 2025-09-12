export const GovernmentIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M19 3C19.5523 3 20 3.44772 20 4V6H23V8H22V19H23V21H1V19H2V8H1V6H4V4C4 3.44772 4.44772 3 5 3H19ZM13 12H11V19H13V12ZM8 12H6V19H8V12ZM18 12H16V19H18V12ZM18 5H6V6H18V5Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
