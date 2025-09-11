export const ArticlePleineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M20 2C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20ZM17 16H7V18H17V16ZM17 12H7V14H17V12ZM11 6H7V10H11V6ZM17 7H13V9H17V7Z"
      fill={fill}
    />
  </svg>
);
