export const CodeBlockIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M4 3H20C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3ZM4 5V19H20V5H4ZM8 8L5 11L8 14L9.4 12.6L7.8 11L9.4 9.4L8 8ZM16 8L14.6 9.4L16.2 11L14.6 12.6L16 14L19 11L16 8Z"
      fill={fill}
    />
  </svg>
);
