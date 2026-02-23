export const Table2Icon = ({
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
      d="M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM19 16H13V19H19V16ZM11 16H5V19H11V16ZM19 10H13V14H19V10ZM11 10H5V14H11V10ZM19 5H13V8H19V5ZM11 5H5V8H11V5Z"
      fill={fill}
    />
  </svg>
);
