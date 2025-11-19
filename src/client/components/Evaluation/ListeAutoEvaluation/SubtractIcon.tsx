export const SubtractIcon = ({
  fill = "#F9B233",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    height="62"
    viewBox="0 0 32 62"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_d_908_16968)">
      <path d="M28 54L16 46.4219L4 54L4.00013 0H28.0001L28 54Z" fill={fill} />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="62"
        id="filter0_d_908_16968"
        width="32"
        x="0"
        y="0"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
        />
        <feBlend
          in2="BackgroundImageFix"
          mode="normal"
          result="effect1_dropShadow_908_16968"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_908_16968"
          mode="normal"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
