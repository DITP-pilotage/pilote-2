export const StopIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill={fill} />
  </svg>
);
