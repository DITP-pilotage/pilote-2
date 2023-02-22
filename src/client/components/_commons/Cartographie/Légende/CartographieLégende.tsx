import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './Élément/CartographieLégendeÉlément';

export default function CartographieLégende({ légende }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w fr-mb-0 fr-pl-1w">
      {
        légende.map(({ remplissage, libellé, picto }) => (
          <CartographieLégendeÉlément
            key={`carto-légende-${libellé}`}
            remplissage={remplissage}
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
