export const PencilIcon = ({
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
      d="M12.9 6.85699V6.85799L17.142 11.101L7.242 21H3V16.757L12.9 6.85699ZM17.849 3.32199L20.678 6.15099C21.0684 6.54149 21.0684 7.17449 20.678 7.56499L18.556 9.68599L14.314 5.44399L16.435 3.32199C16.8255 2.93161 17.4585 2.93161 17.849 3.32199Z"
      fill={fill}
    />
  </svg>
);
