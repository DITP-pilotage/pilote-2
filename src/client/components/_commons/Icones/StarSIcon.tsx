export const StarSIcon = ({
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
      d="M12 17L6.12199 20.59L7.71999 13.89L2.48999 9.41L9.35499 8.86L12 2.5L14.645 8.86L21.511 9.41L16.28 13.89L17.878 20.59L12 17Z"
      fill={fill}
    />
  </svg>
);
