export const H5Icon = ({
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
      d="M21.188 8.9V10.73H16.868L16.748 12.92H17.558C20.348 12.92 21.578 14.195 21.578 16.235C21.578 18.38 19.898 19.7 17.738 19.7C15.788 19.7 14.498 18.845 13.628 17.33L15.398 16.235C15.998 17.39 16.718 17.9 17.738 17.9C18.773 17.9 19.508 17.285 19.508 16.31C19.508 15.32 18.773 14.75 17.468 14.75H14.618L14.933 8.9H21.188ZM15.276 4V5.892H10.172V19.4H8.104V5.892H3V4H15.276Z"
      fill={fill}
    />
  </svg>
);
