export const ArrowFillIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M13 12V20H11V12H4L12 4L20 12H13Z" fill={fill} />
  </svg>
);
