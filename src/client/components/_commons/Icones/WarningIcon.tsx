export const WarningIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M12.8661 3L22.3921 19.5C22.5707 19.8094 22.5707 20.1906 22.3921 20.5C22.2135 20.8094 21.8834 21 21.5261 21H2.4741C2.11683 21 1.78672 20.8094 1.60809 20.5C1.42946 20.1906 1.42947 19.8094 1.6081 19.5L11.1341 3C11.3127 2.69063 11.6428 2.50005 12.0001 2.50005C12.3573 2.50005 12.6875 2.69063 12.8661 3ZM11.0001 16V18H13.0001V16H11.0001ZM11.0001 9V14H13.0001V9H11.0001Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
