import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './CartographieLégendeÉlément/CartographieLégendeÉlément';

export default function CartographieLégende({ nuancier }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w">
      {
        nuancier.map(({ seuil, libellé, couleur }) => (
          <CartographieLégendeÉlément
            couleur={couleur}
            key={`carto-légende-${seuil}`}
            libellé={libellé}
          />
        ))
      }
    </CartographieLégendeStyled>
  );
}
