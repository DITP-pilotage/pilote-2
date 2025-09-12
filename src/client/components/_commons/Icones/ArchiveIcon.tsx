export const ArchiveIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M21 10V20.004C21 20.554 20.555 21 20.007 21H3.993C3.7292 20.9997 3.47633 20.8946 3.29007 20.7078C3.10382 20.521 2.99947 20.2678 3 20.004V10H21ZM15 12H9V14H15V12ZM21.008 3C21.556 3 22 3.444 22 4V8H2V4C2 3.448 2.455 3 2.992 3H21.008Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
