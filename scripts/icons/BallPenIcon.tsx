export const BallPenIcon = ({
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
      d="M14.313 5.44403L19.97 11.101C20.3604 11.4915 20.3604 12.1245 19.97 12.515L12.9 19.586L11.485 18.172L17.849 11.808L17.142 11.101L7.242 21.001H3V16.758L14.313 5.44403ZM18.556 2.61603L21.385 5.44403C21.7754 5.83453 21.7754 6.46753 21.385 6.85803L19.97 8.27303L15.728 4.03003L17.142 2.61603C17.5325 2.22565 18.1655 2.22565 18.556 2.61603Z"
      fill={fill}
    />
  </svg>
);
