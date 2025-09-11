interface ArrowLineIconProps {
  fill?: string;
  className?: string;
}

export const ArrowLineIcon = ({
  fill = 'currentColor',
  className,
}: ArrowLineIconProps) => (
  <svg className={className} viewBox="0 0 24 24">
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.0002 7.828V20H11.0002V7.828L5.63617 13.192L4.22217 11.778L12.0002 4L19.7782 11.778L18.3642 13.192L13.0002 7.828Z" fill={fill}/>
</svg>
);
