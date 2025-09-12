export const TodoIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M9 0V2H15V0H17V2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H7V0H9ZM17 12H7V14H17V12ZM17 8H7V10H17V8Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
