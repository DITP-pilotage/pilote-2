interface ArrowLeftSFirstIconProps {
  fill?: string;
  className?: string;
}

export const ArrowLeftSFirstIcon = ({
  fill = 'currentColor',
  className,
}: ArrowLeftSFirstIconProps) => (
  <svg className={className} viewBox="0 0 24 24">
<path d="M8 6H6V18.73H8V6Z" fill={fill}/>
<path d="M17.778 17.314L12.828 12.364L17.778 7.414L16.364 6L10 12.364L16.364 18.728L17.778 17.314Z" fill={fill}/>
</svg>
);
