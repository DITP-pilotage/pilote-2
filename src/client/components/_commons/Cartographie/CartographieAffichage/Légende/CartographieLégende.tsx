import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './Élément/CartographieLégendeÉlément';

export default function CartographieLégende({ élémentsDeLégende }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w">
      {
        élémentsDeLégende.map(({ couleur, composant }) => (
          <CartographieLégendeÉlément
            couleur={couleur}
            key={`carto-légende-${couleur}`}
          >
            { composant }
          </CartographieLégendeÉlément>
        ))
      }
    </CartographieLégendeStyled>
  );
}
