export const IconeIcon = ({
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
      d="M7.243 18H3V13.757L14.435 2.32202C14.8255 1.93164 15.4585 1.93164 15.849 2.32202L18.678 5.15102C19.0684 5.54152 19.0684 6.17452 18.678 6.56502L7.243 18ZM3 20H21V22H3V20Z"
      fill={fill}
    />
  </svg>
);
