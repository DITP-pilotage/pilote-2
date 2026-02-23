export const H4Icon = ({
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
      d="M15.276 4V5.892H10.172V19.4H8.104V5.892H3V4H15.276ZM20.678 8.9V14.78H21.743V16.61H20.678V19.4H18.653V16.61H13.808V14.78L18.308 8.9H20.678ZM18.653 11.195L15.893 14.78H18.653V11.195Z"
      fill={fill}
    />
  </svg>
);
