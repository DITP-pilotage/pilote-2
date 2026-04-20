export const HashtagIcon = ({
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
      d="M10.951 3L10.426 8H14.415L14.94 3H16.951L16.426 8H20V10H16.216L15.796 14H20V16H15.585L15.06 21H13.049L13.574 16H9.585L9.06 21H7.049L7.574 16H4V14H7.784L8.204 10H4V8H8.415L8.94 3H10.951ZM14.205 10H10.215L9.795 14H13.785L14.205 10Z"
      fill={fill}
    />
  </svg>
);
