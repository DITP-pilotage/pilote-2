export const Pencil1Icon = ({
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
      d="M17.849 3.32196L20.678 6.15096C21.0684 6.54146 21.0684 7.17446 20.678 7.56496L7.243 21H3V16.757L16.435 3.32196C16.8255 2.93158 17.4585 2.93158 17.849 3.32196ZM14.314 8.27196L5 17.586V19H6.414L15.728 9.68596L14.314 8.27196ZM17.142 5.44396L15.728 6.85796L17.142 8.27196L18.556 6.85796L17.142 5.44396Z"
      fill={fill}
    />
  </svg>
);
