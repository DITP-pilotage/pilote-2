export const HighlightIcon = ({
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
      d="M5 3V21H3V3H5ZM15 16V18H7V16H15ZM21 11V13H7V11H21ZM21 6V8H7V6H21Z"
      fill={fill}
    />
  </svg>
);
