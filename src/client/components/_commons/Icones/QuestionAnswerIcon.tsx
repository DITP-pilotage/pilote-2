export const QuestionAnswerIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M21 9C21.5523 9 22 9.44772 22 10V23.5L17.545 20H9C8.44772 20 8 19.5523 8 19V18H18.237L20 19.385V9H21ZM17 3C17.5523 3 18 3.44772 18 4V16H5.455L1 19.5V4C1 3.44772 1.44772 3 2 3H17Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
