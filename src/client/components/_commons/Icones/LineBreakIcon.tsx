export const LineBreakIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M14 18V15H3V13H14V10L19 14L14 18ZM3 4H21V6H3V4ZM3 20H12V22H3V20Z"
      fill={fill}
    />
  </svg>
);
