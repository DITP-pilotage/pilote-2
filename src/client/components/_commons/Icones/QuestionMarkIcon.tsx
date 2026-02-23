export const QuestionMarkIcon = ({
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
      d="M12 19C12.828 19 13.5 19.672 13.5 20.5C13.5 21.328 12.828 22 12 22C11.172 22 10.5 21.328 10.5 20.5C10.5 19.672 11.172 19 12 19ZM12 2C15.314 2 18 4.686 18 8C18 10.165 17.247 11.29 15.326 12.923C13.399 14.56 13 15.297 13 17H11C11 14.526 11.787 13.305 14.031 11.399C15.548 10.11 16 9.434 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8V9H6V8C6 4.686 8.686 2 12 2Z"
      fill={fill}
    />
  </svg>
);
