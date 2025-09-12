export const ArrowFill3Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 13V20L4 12L12 4V11H20V13H12Z" fill={fill} />
  </svg>
);
