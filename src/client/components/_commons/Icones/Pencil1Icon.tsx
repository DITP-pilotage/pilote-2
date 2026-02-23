export const Pencil1Icon = ({
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
      d="M17.849 3.32199L20.678 6.15099C21.0684 6.54149 21.0684 7.17449 20.678 7.56499L7.243 21H3V16.757L16.435 3.32199C16.8255 2.93161 17.4585 2.93161 17.849 3.32199ZM14.314 8.27199L5 17.586V19H6.414L15.728 9.68599L14.314 8.27199ZM17.142 5.44399L15.728 6.85799L17.142 8.27199L18.556 6.85799L17.142 5.44399Z"
      fill={fill}
    />
  </svg>
);
