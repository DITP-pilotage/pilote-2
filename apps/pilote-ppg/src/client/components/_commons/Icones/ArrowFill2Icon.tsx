export const ArrowFill2Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M13 12H20L12 20L4 12H11V4H13V12Z" fill={fill} />
  </svg>
);
