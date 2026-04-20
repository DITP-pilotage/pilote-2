export const Heading2Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M3 4H5V10H9V4H11V18H9V12H5V18H3V4ZM15 16H19V18H13V16.5C13 15.1 13.5 14.1 15.2 12.6C16.9 11.1 17.5 10.5 17.5 9.5C17.5 8.7 16.9 8 16 8C15.1 8 14.5 8.7 14.5 9.5H13C13 7.8 14.3 6.5 16 6.5C17.7 6.5 19 7.8 19 9.5C19 11.3 18.1 12.1 16.3 13.8C15.4 14.6 15.1 15.1 15 16Z"
      fill={fill}
    />
  </svg>
);
