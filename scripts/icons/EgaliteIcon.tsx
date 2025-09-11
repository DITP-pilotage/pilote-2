export const EgaliteIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M20 7H4V10H20V7Z" fill={fill} />
    <path d="M20 14H4V17H20V14Z" fill={fill} />
  </svg>
);
