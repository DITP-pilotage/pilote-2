export const Home4Icon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M20 20C20 20.2653 19.8946 20.5196 19.7071 20.7071C19.5196 20.8947 19.2652 21 19 21H5C4.73478 21 4.48043 20.8947 4.29289 20.7071C4.10536 20.5196 4 20.2653 4 20V11H1L11.327 1.61204C11.5111 1.44452 11.7511 1.35168 12 1.35168C12.2489 1.35168 12.4889 1.44452 12.673 1.61204L23 11H20V20ZM11 13V19H13V13H11Z"
      fill={fill}
    />
  </svg>
);
