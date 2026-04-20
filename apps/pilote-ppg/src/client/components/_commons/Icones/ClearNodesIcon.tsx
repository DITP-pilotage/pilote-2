export const ClearNodesIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M19 13H5V11H19V13ZM3 17H17V15H3V17ZM7 7V9H17V7H7Z" fill={fill} />
  </svg>
);
