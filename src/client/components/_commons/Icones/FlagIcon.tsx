export const FlagIcon = ({
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
      d="M3 3H12.382C12.7607 3.0002 13.1067 3.21427 13.276 3.553L14 5H20C20.5523 5 21 5.44772 21 6V17C21 17.5523 20.5523 18 20 18H13.618C13.2393 17.9998 12.8933 17.7857 12.724 17.447L12 16H5V22H3V3Z"
      fill={fill}
    />
  </svg>
);
