import Image from 'next/image';
import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './Élément/CartographieLégendeÉlément';

export default function CartographieLégende({ élémentsDeLégende }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w fr-mb-3w">
      {
        élémentsDeLégende.map(({ couleur, libellé, picto }) => (
          <CartographieLégendeÉlément
            couleur={couleur}
            key={`carto-légende-${couleur}`}
          >
            <span>
              {libellé}
            </span>
            { picto ?
              <Image
                alt={libellé}
                src={picto}
              /> 
              : null }
          </CartographieLégendeÉlément>
        ))
      }
    </CartographieLégendeStyled>
  );
}
