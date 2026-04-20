export const LightbulbIcon = ({
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
      d="M10.9999 18H7.94094C7.64394 16.727 6.30394 15.686 5.75394 15C3.13552 11.7285 3.48518 6.99083 6.55552 4.1392C9.62587 1.28757 14.3764 1.28833 17.4458 4.14094C20.5153 6.99355 20.8634 11.7313 18.2439 15.002C17.6939 15.687 16.3559 16.728 16.0589 18H12.9999V13H10.9999V18ZM15.9999 20V21C15.9999 22.1045 15.1045 23 13.9999 23H9.99994C8.89537 23 7.99994 22.1045 7.99994 21V20H15.9999Z"
      fill={fill}
    />
  </svg>
);
