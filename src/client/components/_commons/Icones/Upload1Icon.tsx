export const Upload1Icon = ({
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
      d="M3 19H21V21H3V19ZM13 5.828V17H11V5.828L4.929 11.9L3.515 10.486L12 2L20.485 10.485L19.071 11.899L13 5.83V5.828Z"
      fill={fill}
    />
  </svg>
);
