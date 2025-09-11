export const ArrowFill1Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 13H4V11H12V4L20 12L12 20V13Z" fill={fill} />
  </svg>
);
