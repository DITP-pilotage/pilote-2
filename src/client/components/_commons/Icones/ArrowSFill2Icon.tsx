export const ArrowSFill2Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M12 16L6 10H18L12 16Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
