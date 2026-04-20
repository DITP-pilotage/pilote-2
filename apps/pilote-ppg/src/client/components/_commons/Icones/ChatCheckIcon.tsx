export const ChatCheckIcon = ({
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
      d="M21 3C21.5523 3 22 3.44772 22 4V18C22 18.5523 21.5523 19 21 19H6.455L2 22.5V4C2 3.44772 2.44772 3 3 3H21ZM15.536 7.879L11.293 12.121L8.818 9.646L7.404 11.061L11.293 14.95L16.95 9.293L15.536 7.879Z"
      fill={fill}
    />
  </svg>
);
