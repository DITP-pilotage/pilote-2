import PictoBaromètreStyled from '@/components/_commons/PictoBaromètre/PictoBaromètre.styled';
import PictoBaromètreProps from '@/components/_commons/PictoBaromètre/PictoBaromètre.interface';

export default function PictoBaromètre({ taille, className }: PictoBaromètreProps) {
  return (
    <PictoBaromètreStyled
      aria-hidden="true"
      className={`fr-icon-dashboard-3-line ${className}`}
      taille={taille}
    />
  );
}
