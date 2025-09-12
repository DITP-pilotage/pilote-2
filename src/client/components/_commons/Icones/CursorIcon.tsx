export const CursorIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M13.91 12.3601L17 20.8541L14.182 21.8801L11.09 13.3861L6.91797 16.5421L8.40797 1.63306L19.134 12.0961L13.91 12.3601Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
