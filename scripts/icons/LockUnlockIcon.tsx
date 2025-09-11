export const LockUnlockIcon = ({
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
      d="M18.262 5.86901L16.473 6.76301C15.4364 4.68776 13.1085 3.59805 10.8509 4.13118C8.59323 4.66432 6.99876 6.68026 7 9.00001V10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9.00001C4.99883 5.75267 7.23115 2.93091 10.3916 2.18477C13.5521 1.43862 16.8107 2.96403 18.262 5.86901ZM14 15H10V17H14V15Z"
      fill={fill}
    />
  </svg>
);
