export const ArticleContourIcon = ({
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
      d="M20 2C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20ZM19 4H5V20H19V4ZM17 16V18H7V16H17ZM17 12V14H7V12H17ZM11 6V10H7V6H11ZM17 7V9H13V7H17Z"
      fill={fill}
    />
  </svg>
);
