export const Heading1Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M3 4H5V10H9V4H11V18H9V12H5V18H3V4ZM14 18V7H13V5H16V18H14Z"
      fill={fill}
    />
  </svg>
);
