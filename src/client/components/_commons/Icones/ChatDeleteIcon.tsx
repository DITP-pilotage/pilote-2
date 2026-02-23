export const ChatDeleteIcon = ({
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
      d="M21 3C21.5523 3 22 3.44772 22 4V18C22 18.5523 21.5523 19 21 19H6.455L2 22.5V4C2 3.44772 2.44772 3 3 3H21ZM9.525 7.11L8.111 8.525L10.586 11L8.11 13.475L9.524 14.889L12 12.414L14.475 14.889L15.889 13.475L13.414 11H13.415L15.889 8.525L14.475 7.111L12 9.586L9.525 7.11Z"
      fill={fill}
    />
  </svg>
);
