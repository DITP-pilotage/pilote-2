export const FilterIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21 4V6H20L14 15V22H10V15L4 6H3V4H21Z" fill={fill} />
  </svg>
);
