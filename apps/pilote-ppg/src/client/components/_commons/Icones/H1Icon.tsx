export const H1Icon = ({
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
      d="M16.276 4V5.892H11.172V19.4H9.104V5.892H4V4H16.276ZM19.503 8.885V19.385H17.478V10.97L15.303 12.2L14.298 10.76L17.538 8.885H19.503Z"
      fill={fill}
    />
  </svg>
);
