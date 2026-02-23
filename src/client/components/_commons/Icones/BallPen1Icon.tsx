export const BallPen1Icon = ({
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
      d="M14.313 5.444L19.97 11.101C20.3604 11.4915 20.3604 12.1245 19.97 12.515L12.9 19.586L11.485 18.172L17.849 11.808L17.142 11.101L7.242 21.001H3V16.758L14.313 5.444ZM14.313 8.273L5 17.586V19.001H6.414L15.728 9.687L14.313 8.273ZM18.556 2.616L21.385 5.444C21.7754 5.8345 21.7754 6.4675 21.385 6.858L19.97 8.273L15.728 4.03L17.142 2.616C17.5325 2.22562 18.1655 2.22562 18.556 2.616Z"
      fill={fill}
    />
  </svg>
);
