export const CenteredIcon = ({
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
      d="M3 4H21V6H3V4ZM4.875 19H19.125V21H4.875V19ZM3 14H21V16H3V14ZM4.875 9H19.125V11H4.875V9Z"
      fill={fill}
    />
  </svg>
);
