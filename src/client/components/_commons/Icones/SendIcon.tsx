export const SendIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 12 12">
    <path
      clipRule="evenodd"
      d="M10.5 1.5C10.7761 1.5 11 1.72386 11 2V10.0033C11 10.2776 10.7724 10.5 10.5041 10.5H1.4959C1.22203 10.5 1 10.2775 1 10.0033V9.5H10V3.65L6 7.25L1 2.75V2C1 1.72386 1.22386 1.5 1.5 1.5H10.5ZM4 7.5V8.5H0V7.5H4ZM2.5 5V6H0V5H2.5ZM9.78295 2.5H2.21707L6 5.90465L9.78295 2.5Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
