export const CursorIcon = ({
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
      d="M13.91 12.36L17 20.854L14.182 21.88L11.09 13.386L6.91797 16.542L8.40797 1.633L19.134 12.096L13.91 12.36Z"
      fill={fill}
    />
  </svg>
);
