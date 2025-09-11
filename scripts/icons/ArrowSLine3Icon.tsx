interface ArrowSLine3IconProps {
  fill?: string;
  className?: string;
}

export const ArrowSLine3Icon = ({
  fill = "currentColor",
  className,
}: ArrowSLine3IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M10.828 12L15.778 16.95L14.364 18.364L8 12L14.364 5.63599L15.778 7.04999L10.828 12Z"
      fill={fill}
    />
  </svg>
);
