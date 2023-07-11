import PictoBaromètreStyled from '@/components/_commons/PictoBaromètre/PictoBaromètre.styled';

export default function PictoBaromètre() {
  return (
    <>
      <PictoBaromètreStyled
        className="fr-icon-dashboard-3-line"
      />
      <span className="fr-sr-only">
        élément du baromètre
      </span>
    </>
  );
}
