interface ArrowSFill2IconProps {
  fill?: string;
  className?: string;
}

export const ArrowSFill2Icon = ({
  fill = "currentColor",
  className,
}: ArrowSFill2IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 16L6 10H18L12 16Z"
      fill={fill}
    />
  </svg>
);
