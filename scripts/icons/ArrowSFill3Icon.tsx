interface ArrowSFill3IconProps {
  fill?: string;
  className?: string;
}

export const ArrowSFill3Icon = ({
  fill = "currentColor",
  className,
}: ArrowSFill3IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8 12L14 6V18L8 12Z"
      fill={fill}
    />
  </svg>
);
