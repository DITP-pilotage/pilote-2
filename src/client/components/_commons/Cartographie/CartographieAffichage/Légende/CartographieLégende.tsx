import CartographieLégendeProps from './CartographieLégende.interface';
import CartographieLégendeStyled from './CartographieLégende.styled';
import CartographieLégendeÉlément from './Élément/CartographieLégendeÉlément';

export default function CartographieLégende({ élémentsDeLégende }: CartographieLégendeProps) {
  return (
    <CartographieLégendeStyled className="fr-mt-1w fr-mb-3w fr-pl-1w">
      {
        élémentsDeLégende.map(({ remplissage, libellé, picto }) => (
          <CartographieLégendeÉlément
            key={`carto-légende-${remplissage.valeur}`}
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
