interface ArrowRightUpIconProps {
  fill?: string;
  className?: string;
}

export const ArrowRightUpIcon = ({
  fill = 'currentColor',
  className,
}: ArrowRightUpIconProps) => (
  <svg className={className} viewBox="0 0 24 24">
<path d="M13.0711 12.3639L7.41421 18.0208L6 16.6066L11.6569 10.9497L6.7071 6H18.0209V17.3137L13.0711 12.3639Z" fill={fill}/>
</svg>
);
