export const HorizontalRuleIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M4 11H20V13H4V11Z" fill={fill} />
  </svg>
);
