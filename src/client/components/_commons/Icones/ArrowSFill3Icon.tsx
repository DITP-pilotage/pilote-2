export const ArrowSFill3Icon = ({
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
      d="M8 12L14 6V18L8 12Z"
      fill={fill}
    />
  </svg>
);
