export const Discuss1Icon = ({
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
      d="M22 6.103C22.5523 6.103 23 6.55072 23 7.103V18C23 18.5523 22.5523 19 22 19H16.8L14 22.5L11.2 19H6C5.44772 19 5 18.5523 5 18V7.103C5 6.55072 5.44772 6.103 6 6.103H22ZM21 8.103H7V17H12.161L14 19.298L15.839 17H21V8.103ZM19 2V4H3V15H1V3C1 2.44772 1.44772 2 2 2H19Z"
      fill={fill}
    />
  </svg>
);
