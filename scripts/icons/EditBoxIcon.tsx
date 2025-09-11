export const EditBoxIcon = ({
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
      d="M16.757 2.99998L9.291 10.466L9.299 14.713L13.537 14.706L21 7.24298V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V3.99998C3 3.44769 3.44772 2.99998 4 2.99998H16.757ZM20.485 2.09998L21.9 3.51598L12.708 12.708L11.296 12.711L11.294 11.294L20.485 2.09998Z"
      fill={fill}
    />
  </svg>
);
