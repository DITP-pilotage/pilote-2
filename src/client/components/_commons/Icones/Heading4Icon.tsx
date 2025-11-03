export const Heading4Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M3 4H5V10H9V4H11V18H9V12H5V18H3V4ZM18 18V14H13V12.5L17.5 5H19V12.5H20.5V14H19V18H18ZM15.5 12.5H18V8.5L15.5 12.5Z"
      fill={fill}
    />
  </svg>
);
