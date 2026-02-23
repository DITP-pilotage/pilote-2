export const ArrowSFillIcon = ({
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
      d="M12 8L18 14H6L12 8Z"
      fill={fill}
    />
  </svg>
);
