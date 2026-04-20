export const Heading5Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M3 4H5V10H9V4H11V18H9V12H5V18H3V4ZM15 5V10H17.5C18.3 10 19 10.7 19 11.5C19 12.3 18.3 13 17.5 13C16.7 13 16 12.3 16 11.5H14.5C14.5 13.2 15.8 14.5 17.5 14.5C19.2 14.5 20.5 13.2 20.5 11.5C20.5 9.8 19.2 8.5 17.5 8.5H16.5V6.5H20V5H15Z"
      fill={fill}
    />
  </svg>
);
