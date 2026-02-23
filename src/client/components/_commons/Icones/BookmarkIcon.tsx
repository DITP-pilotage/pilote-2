export const BookmarkIcon = ({
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
      d="M5 2H19C19.5523 2 20 2.44772 20 3V22.143C20.0002 22.3251 19.9015 22.4929 19.7421 22.5811C19.5828 22.6693 19.3882 22.6639 19.234 22.567L12 18.03L4.766 22.566C4.61197 22.6628 4.41754 22.6683 4.2583 22.5803C4.09905 22.4924 4 22.3249 4 22.143V3C4 2.44772 4.44772 2 5 2Z"
      fill={fill}
    />
  </svg>
);
