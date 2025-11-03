export const Heading3Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M3 4H5V10H9V4H11V18H9V12H5V18H3V4ZM15 7.5C15 6.7 15.7 6 16.5 6C17.3 6 18 6.7 18 7.5C18 8.3 17.3 9 16.5 9H15.5V10.5H16.5C17.3 10.5 18 11.2 18 12C18 12.8 17.3 13.5 16.5 13.5C15.7 13.5 15 12.8 15 12H13.5C13.5 13.6 14.8 15 16.5 15C18.2 15 19.5 13.6 19.5 12C19.5 11.2 19.1 10.5 18.5 10C19.1 9.5 19.5 8.8 19.5 8C19.5 6.3 18.2 5 16.5 5C14.8 5 13.5 6.3 13.5 8H15V7.5Z"
      fill={fill}
    />
  </svg>
);
