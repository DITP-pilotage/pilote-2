interface ArrowFill2IconProps {
  fill?: string;
  className?: string;
}

export const ArrowFill2Icon = ({
  fill = "currentColor",
  className,
}: ArrowFill2IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M13 12H20L12 20L4 12H11V4H13V12Z" fill={fill} />
  </svg>
);
