export const BankIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M22 20V22H2V20H22ZM6 12V19H4V12H6ZM11 12V19H9V12H11ZM15 12V19H13V12H15ZM20 12V19H18V12H20ZM12 2L22 7V11H2V7L12 2ZM12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
