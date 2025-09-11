export const AddLineIcon = ({
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
      d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"
      fill={fill}
    />
  </svg>
);
