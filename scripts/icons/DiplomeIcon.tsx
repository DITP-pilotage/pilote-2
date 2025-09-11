export const DiplomeIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M11.5225 15.5371L11.9922 15.7939L12.4668 15.5439L17.9092 12.6787V16.4785L12 20.1143L5.63672 16.4785V12.3262L11.5225 15.5371ZM22 9.2041V16.4775H20.6367V10.1133L17.9092 11.5488L12.001 14.6592L12 14.6582V14.6592L2 9.2041L12 3.75L22 9.2041Z"
      fill={fill}
    />
  </svg>
);
