import FlècheDeTriProps from './FlècheDeTri.interface';

export default function FlècheDeTri({ estActif, direction }: FlècheDeTriProps) {
  return (
    <svg
      fill='none'
      height='6'
      viewBox='0 0 12 6'
      width='12'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        clipRule='evenodd'
        d={direction === 'asc' ? 'M6 0L12 6H0L6 0Z' : 'M6 6L0 0H12L6 6Z'}
        fill={estActif ? 'white' : '#000091'}
        fillRule='evenodd'
      />
    </svg>
  );
}
