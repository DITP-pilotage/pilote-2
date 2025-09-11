export const EnveloppePleineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M20.2522 4H3.74698C2.78406 4 2 4.77832 2 5.73461V18.2654C2 19.2217 2.78364 20 3.74698 20H20.2526C21.2155 20 22 19.2217 22 18.2654V5.73461C21.9996 4.77832 21.2155 4 20.2522 4ZM11.9998 13.3114L4.77063 7.6897L6.05299 6.06452L11.9998 10.6886L17.9462 6.06452L19.2285 7.6897L11.9998 13.3114Z"
      fill={fill}
    />
  </svg>
);
