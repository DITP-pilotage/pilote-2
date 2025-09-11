export const FileText1Icon = ({
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
      d="M14.997 2L21 8V20.993C21.0019 21.2582 20.8983 21.5133 20.7121 21.7022C20.5258 21.891 20.2722 21.9981 20.007 22H3.993C3.44497 22 3.00055 21.556 3 21.008V2.992C3 2.455 3.449 2 4.002 2H14.997ZM14 4H5V20H19V9H14V4ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"
      fill={fill}
    />
  </svg>
);
