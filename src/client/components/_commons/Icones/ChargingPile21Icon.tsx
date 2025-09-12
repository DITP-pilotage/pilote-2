export const ChargingPile21Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M13 3C13.5523 3 14 3.44772 14 4V12H16C17.1046 12 18 12.8954 18 14V18C18 18.5523 18.4477 19 19 19C19.5523 19 20 18.5523 20 18V11H19V7H20V4H22V7H23V11H22V18C22 19.6569 20.6569 21 19 21C17.3431 21 16 19.6569 16 18V14H14V19H15V21H2V19H3V4C3 3.44772 3.44772 3 4 3H13ZM5 19H12V5H5V13L9 7V11H12L8 17V13H5V19Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
