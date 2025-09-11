interface ArrowLine2IconProps {
  fill?: string;
  className?: string;
}

export const ArrowLine2Icon = ({
  fill = "currentColor",
  className,
}: ArrowLine2IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M13.0002 16.172L18.3642 10.808L19.7782 12.222L12.0002 20L4.22217 12.222L5.63617 10.808L11.0002 16.172V4H13.0002V16.172Z"
      fill={fill}
    />
  </svg>
);
