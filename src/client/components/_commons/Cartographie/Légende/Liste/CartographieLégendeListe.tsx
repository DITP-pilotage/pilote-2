import { FunctionComponent } from 'react';
import { CartographieÉlémentDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import CartographieLégendeListeStyled from './CartographieLégendeListe.styled';
import CartographieLégendeListeÉlément from './Élément/CartographieLégendeListeÉlément';

interface CartographieLégendeListeProps {
  contenu: CartographieÉlémentDeLégende[],
}

const CartographieLégendeListe: FunctionComponent<CartographieLégendeListeProps> = ({ contenu }) => {
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
};

export default CartographieLégendeListe;
