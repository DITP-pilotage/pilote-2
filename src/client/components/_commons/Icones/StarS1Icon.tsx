export const StarS1Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.0002 2.5L14.6452 8.86L21.5112 9.41L16.2802 13.89L17.8782 20.59L12.0002 17L6.12223 20.59L7.72023 13.89L2.49023 9.41L9.35523 8.86L12.0002 2.5ZM12.0002 7.708L10.7322 10.755L7.44223 11.019L9.94923 13.166L9.18323 16.376L12.0002 14.657V14.656L14.8172 16.376L14.0512 13.166L16.5582 11.019L13.2682 10.755L12.0002 7.708Z"
      fill={fill}
    />
  </svg>
);
