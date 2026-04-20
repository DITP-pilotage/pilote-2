export const IconeIcon = ({
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
      d="M7.243 18H3V13.757L14.435 2.322C14.8255 1.93162 15.4585 1.93162 15.849 2.322L18.678 5.151C19.0684 5.5415 19.0684 6.1745 18.678 6.565L7.243 18ZM3 20H21V22H3V20Z"
      fill={fill}
    />
  </svg>
);
