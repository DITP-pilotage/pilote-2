export const SubtractLineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M5 11H19V13H5V11Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
