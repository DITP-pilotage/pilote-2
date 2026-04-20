export const StarS1Icon = ({
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
      d="M12 2.5L14.645 8.86L21.511 9.41L16.28 13.89L17.878 20.59L12 17L6.12199 20.59L7.71999 13.89L2.48999 9.41L9.35499 8.86L12 2.5ZM12 7.708L10.732 10.755L7.44199 11.019L9.94899 13.166L9.18299 16.376L12 14.657V14.656L14.817 16.376L14.051 13.166L16.558 11.019L13.268 10.755L12 7.708Z"
      fill={fill}
    />
  </svg>
);
