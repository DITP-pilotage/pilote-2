export const CarrevalideContourIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M18.0732 8.92969L11.0029 16.001L6.75977 11.7578L8.17383 10.3438L11.0029 13.1729L16.6592 7.51562L18.0732 8.92969Z"
      fill={fill}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M19.5 2.5C20.6046 2.5 21.5 3.39543 21.5 4.5V19.5C21.5 20.6046 20.6046 21.5 19.5 21.5H4.5C3.39543 21.5 2.5 20.6046 2.5 19.5V4.5C2.5 3.39543 3.39543 2.5 4.5 2.5H19.5ZM5.5 4.5C4.94772 4.5 4.5 4.94772 4.5 5.5V18.5C4.5 19.0523 4.94772 19.5 5.5 19.5H18.5C19.0523 19.5 19.5 19.0523 19.5 18.5V5.5C19.5 4.94772 19.0523 4.5 18.5 4.5H5.5Z"
      fill={fill}
    />
  </svg>
);
