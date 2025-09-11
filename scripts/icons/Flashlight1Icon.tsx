export const Flashlight1Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M13 9H21L11 24V15H4L13 0V9ZM11 11V7.22L7.532 13H13V17.394L17.263 11H11Z"
      fill={fill}
    />
  </svg>
);
