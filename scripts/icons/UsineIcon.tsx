export const UsineIcon = ({
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
      d="M14 10H22V22H2V10L9 7V9L14 7V10ZM7 18H9V14H7V18ZM11 18H13V14H11V18ZM15 18H17V14H15V18Z"
      fill={fill}
    />
    <path d="M21.7998 8.40039H17.2002L18 2H21L21.7998 8.40039Z" fill={fill} />
  </svg>
);
