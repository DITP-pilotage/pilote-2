export const MailOpenIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      clipRule="evenodd"
      d="M12.519 1.30999L21.757 6.85499C21.9078 6.94534 22 7.10822 22 7.28399V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V7.28299C2 7.10722 2.09222 6.94434 2.243 6.85399L11.49 1.30999C11.8067 1.11998 12.2023 1.11998 12.519 1.30999ZM5.647 8.23799L4.353 9.76199L12.073 16.317L19.654 9.75699L18.346 8.24399L12.061 13.683L5.647 8.23799Z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);
