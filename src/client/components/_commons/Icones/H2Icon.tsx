export const H2Icon = ({
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
      d="M15.276 4V5.892H10.172V19.4H8.104V5.892H3V4H15.276ZM17.828 8.6C19.658 8.6 21.128 9.77 21.128 11.57C21.128 13.01 20.183 14.12 19.148 15.125L16.613 17.57H21.398V19.4H14.138V17.57L17.738 14.03C18.548 13.205 19.058 12.635 19.058 11.78C19.058 10.91 18.458 10.4 17.633 10.4C16.628 10.4 16.013 11.015 15.458 11.945L13.808 10.94C14.693 9.5 15.998 8.6 17.828 8.6Z"
      fill={fill}
    />
  </svg>
);
