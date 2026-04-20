export const ArrowSFill1Icon = ({
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
      d="M16 12L10 18V6L16 12Z"
      fill={fill}
    />
  </svg>
);
