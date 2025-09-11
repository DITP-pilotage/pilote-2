interface ArrowLine3IconProps {
  fill?: string;
  className?: string;
}

export const ArrowLine3Icon = ({
  fill = 'currentColor',
  className,
}: ArrowLine3IconProps) => (
  <svg className={className} viewBox="0 0 24 24">
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.828 11H20V13H7.828L13.192 18.364L11.778 19.778L4 12L11.778 4.22205L13.192 5.63605L7.828 11Z" fill={fill}/>
</svg>
);
