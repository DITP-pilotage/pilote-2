export const GitRepository1Icon = ({
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
      d="M20 2C20.5523 2 21 2.44772 21 3V20C21 20.5523 20.5523 21 20 21H13V23.5L10 21.5L7 23.5V21H6.5C4.567 21 3 19.433 3 17.5V5C3 3.34315 4.34315 2 6 2H20ZM19 16H6.5C5.67157 16 5 16.6716 5 17.5C5 18.3284 5.67157 19 6.5 19H7V17H13V19H19V16ZM19 4H6V14.035C6.16563 14.0115 6.33271 13.9998 6.5 14H19V4ZM9 11V13H7V11H9ZM9 8V10H7V8H9ZM9 5V7H7V5H9Z"
      fill={fill}
    />
  </svg>
);
