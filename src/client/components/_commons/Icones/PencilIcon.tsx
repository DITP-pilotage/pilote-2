export const PencilIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M12.9 6.85696V6.85796L17.142 11.101L7.242 21H3V16.757L12.9 6.85696ZM17.849 3.32196L20.678 6.15096C21.0684 6.54146 21.0684 7.17446 20.678 7.56496L18.556 9.68596L14.314 5.44396L16.435 3.32196C16.8255 2.93158 17.4585 2.93158 17.849 3.32196Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
