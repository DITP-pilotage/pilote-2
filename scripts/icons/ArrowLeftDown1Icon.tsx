interface ArrowLeftDown1IconProps {
  fill?: string;
  className?: string;
}

export const ArrowLeftDown1Icon = ({
  fill = "currentColor",
  className,
}: ArrowLeftDown1IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M8 14.6066L16.6066 6L18.0208 7.41422L9.4142 16.0208H17V18.0208H6V7.02082H8V14.6066Z"
      fill={fill}
    />
  </svg>
);
