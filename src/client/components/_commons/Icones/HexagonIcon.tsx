export const HexagonIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M17.5 2.5L23 12L17.5 21.5H6.5L1 12L6.5 2.5H17.5Z" fill={fill} />
  </svg>
);
