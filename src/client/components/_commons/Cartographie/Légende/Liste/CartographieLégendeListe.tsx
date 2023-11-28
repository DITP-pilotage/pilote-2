import CartographieLégendeListeProps from './CartographieLégendeListe.interface';
import CartographieLégendeListeStyled from './CartographieLégendeListe.styled';
import CartographieLégendeListeÉlément from './Élément/CartographieLégendeListeÉlément';

export default function CartographieLégendeListe({ contenu }: CartographieLégendeListeProps) {
  return (
    <CartographieLégendeListeStyled className='fr-mt-1w fr-mb-0 fr-pl-0'>
      {
        contenu.map(({ remplissage, libellé, picto }) => (
          <CartographieLégendeListeÉlément
            key={`carto-légende-${libellé}`}
            remplissage={remplissage}
          >
            <span>
              {libellé}
            </span>
            {picto ?? null}
          </CartographieLégendeListeÉlément>
        ))
      }
    </CartographieLégendeListeStyled>
  );
}
