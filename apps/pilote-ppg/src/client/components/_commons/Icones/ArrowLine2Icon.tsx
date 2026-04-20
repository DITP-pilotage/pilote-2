export const ArrowLine2Icon = ({
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
      d="M12.9999 16.172L18.3639 10.808L19.7779 12.222L11.9999 20L4.22192 12.222L5.63592 10.808L10.9999 16.172V4H12.9999V16.172Z"
      fill={fill}
    />
  </svg>
);
