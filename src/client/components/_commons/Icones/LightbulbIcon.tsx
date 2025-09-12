export const LightbulbIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M10.9998 18H7.94082C7.64382 16.727 6.30382 15.686 5.75382 15C3.13539 11.7285 3.48506 6.99083 6.5554 4.1392C9.62575 1.28757 14.3763 1.28833 17.4457 4.14094C20.5152 6.99355 20.8633 11.7313 18.2438 15.002C17.6938 15.687 16.3558 16.728 16.0588 18H12.9998V13H10.9998V18ZM15.9998 20V21C15.9998 22.1045 15.1044 23 13.9998 23H9.99982C8.89525 23 7.99982 22.1045 7.99982 21V20H15.9998Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
