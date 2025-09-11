export const FlashlightIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M13 10H20L11 23V14H4L13 1V10Z" fill={fill} />
  </svg>
);
