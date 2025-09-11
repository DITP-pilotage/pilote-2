interface ArrowFillIconProps {
  fill?: string;
  className?: string;
}

export const ArrowFillIcon = ({
  fill = "currentColor",
  className,
}: ArrowFillIconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M13 12V20H11V12H4L12 4L20 12H13Z" fill={fill} />
  </svg>
);
