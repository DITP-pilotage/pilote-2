export const StarSIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M12.0002 17L6.12223 20.59L7.72023 13.89L2.49023 9.41L9.35523 8.86L12.0002 2.5L14.6452 8.86L21.5112 9.41L16.2802 13.89L17.8782 20.59L12.0002 17Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
