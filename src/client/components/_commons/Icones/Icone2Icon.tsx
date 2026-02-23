export const Icone2Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 4.5H21V6.5H3V4.5ZM3 11.5H21V13.5H3V11.5ZM3 18.5H21V20.5H3V18.5Z"
      fill={fill}
    />
  </svg>
);
