export const SaveIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 12 12">
    <path
      clipRule="evenodd"
      d="M3.5 9.5V6.5H8.5V9.5H9.5V3.914L8.086 2.5H2.5V9.5H3.5ZM2 1.5H8.5L10.5 3.5V10C10.5 10.2761 10.2761 10.5 10 10.5H2C1.72386 10.5 1.5 10.2761 1.5 10V2C1.5 1.72386 1.72386 1.5 2 1.5ZM4.5 7.5V9.5H7.5V7.5H4.5Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
