export const LockUnlock1Icon = ({
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
      d="M18.262 5.86904L16.473 6.76304C15.4364 4.68779 13.1085 3.59808 10.8509 4.13121C8.59323 4.66435 6.99876 6.68029 7 9.00004V10H20C20.5523 10 21 10.4478 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4478 3.44772 10 4 10H5V9.00004C4.99883 5.7527 7.23115 2.93094 10.3916 2.1848C13.5521 1.43865 16.8107 2.96406 18.262 5.86904ZM19 12H5V20H19V12ZM14 15V17H10V15H14Z"
      fill={fill}
    />
  </svg>
);
