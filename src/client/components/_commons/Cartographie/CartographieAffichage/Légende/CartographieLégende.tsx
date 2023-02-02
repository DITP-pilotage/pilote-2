import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './Élément/CartographieLégendeÉlément';

export default function CartographieLégende({ élémentsDeLégende }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w fr-mb-3w fr-pl-1w">
      {
        élémentsDeLégende.map(({ couleur, libellé, picto, hachures }) => (
          <CartographieLégendeÉlément
            couleur={couleur}
            hachures={hachures}
            key={`carto-légende-${couleur}`}
          >
            <span>
              {libellé}
            </span>
            {picto ?? null}
          </CartographieLégendeÉlément>
        ))
      }
    </CartographieLégendeStyled>
  );
}
