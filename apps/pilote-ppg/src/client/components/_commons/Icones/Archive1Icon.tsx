export const Archive1Icon = ({
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
      d="M21.008 3C21.2732 2.99945 21.5275 3.1053 21.714 3.29384C21.9004 3.48238 22.0035 3.73785 22.0001 4.003V10H21V20.001C21.0008 20.2652 20.8966 20.5188 20.7104 20.7062C20.5242 20.8935 20.2712 20.9992 20.007 21H3.993C3.72884 20.9992 3.47582 20.8935 3.2896 20.7062C3.10338 20.5188 2.9992 20.2652 3 20.001V10H2V4.003C2 3.449 2.455 3 2.992 3H21.008ZM19 10H5V19H19V10ZM15 12V14H9V12H15ZM20 5H4V8H20V5Z"
      fill={fill}
    />
  </svg>
);
