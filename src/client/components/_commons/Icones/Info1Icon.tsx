export const Info1Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M4.5 2.5H19.5C20.6046 2.5 21.5 3.39543 21.5 4.5V19.5C21.5 20.6046 20.6046 21.5 19.5 21.5H4.5C3.39543 21.5 2.5 20.6046 2.5 19.5V4.5C2.5 3.39543 3.39543 2.5 4.5 2.5ZM5.5 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H5.5C4.94772 19.5 4.5 19.0523 4.5 18.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5Z"
      fill={fill}
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M11 11V17H13V11H11ZM11 7V9H13V7H11Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
