export const PieChartIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M11 2.04944V13.0001H21.9506C21.4489 18.0534 17.1853 22.0001 12 22.0001C6.47715 22.0001 2 17.523 2 12.0001C2 6.81471 5.94668 2.55116 11 2.04944ZM13 2.04944C17.7244 2.51851 21.4816 6.27565 21.9506 11.0001H13V2.04944Z"
      fill={fill}
    />
  </svg>
);
