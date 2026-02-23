export const ArrowLineIcon = ({
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
      d="M12.9999 7.828V20H10.9999V7.828L5.63592 13.192L4.22192 11.778L11.9999 4L19.7779 11.778L18.3639 13.192L12.9999 7.828Z"
      fill={fill}
    />
  </svg>
);
