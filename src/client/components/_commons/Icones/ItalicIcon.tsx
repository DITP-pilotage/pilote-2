export const ItalicIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M15 20H7V18H9.927L12.043 6H9V4H17V6H14.073L11.957 18H15V20Z"
      fill={fill}
    />
  </svg>
);
