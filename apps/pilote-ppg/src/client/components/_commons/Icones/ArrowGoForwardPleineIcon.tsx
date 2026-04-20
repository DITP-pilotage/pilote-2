export const ArrowGoForwardPleineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M15 7V11L21 6L15 1V5H10C7.87827 5 5.84344 5.84285 4.34315 7.34315C2.84285 8.84344 2 10.8783 2 13C2 15.1217 2.84285 17.1566 4.34315 18.6569C5.84344 20.1571 7.87827 21 10 21H19V19H10C8.4087 19 6.88258 18.3679 5.75736 17.2426C4.63214 16.1174 4 14.5913 4 13C4 11.4087 4.63214 9.88258 5.75736 8.75736C6.88258 7.63214 8.4087 7 10 7H15Z"
      fill={fill}
    />
  </svg>
);
