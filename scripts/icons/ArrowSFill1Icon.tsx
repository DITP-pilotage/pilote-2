interface ArrowSFill1IconProps {
  fill?: string;
  className?: string;
}

export const ArrowSFill1Icon = ({
  fill = "currentColor",
  className,
}: ArrowSFill1IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M16 12L10 18V6L16 12Z"
      fill={fill}
    />
  </svg>
);
