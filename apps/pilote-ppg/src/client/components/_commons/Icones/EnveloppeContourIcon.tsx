export const EnveloppeContourIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M20.2526 4H3.7474C2.78406 4 2 4.77832 2 5.73461V18.2654C2 19.2217 2.78365 20 3.7474 20H20.2526C21.2159 20 22 19.2217 22 18.2654V5.73461C22 4.77832 21.2159 4 20.2526 4ZM17.9466 6.06452L12.0002 10.6886L6.05341 6.06452H17.9466ZM4.07974 17.9355V7.1521L12.0002 13.3114L19.9203 7.1521V17.9355H4.07974Z"
      fill={fill}
    />
  </svg>
);
