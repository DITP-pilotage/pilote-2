import { FunctionComponent } from 'react';
import CartographieLégendeDégradéStyled from './CartographieLégendeDégradé.styled';
import { CartographieLégendeDégradéContenu } from './CartographieLégendeDégradé.interface';

interface CartographieLégendeDégradéProps {
  contenu: CartographieLégendeDégradéContenu,
}

const CartographieLégendeDégradé: FunctionComponent<CartographieLégendeDégradéProps> = ({ contenu }) => {
  return (
    <CartographieLégendeDégradéStyled
      className='fr-mt-1w'
      couleurMax={contenu.couleurMax}
      couleurMin={contenu.couleurMin}
    >
      <p className='fr-text--xs texte-gris fr-mb-0'>
        { contenu.libellé }
      </p>
      <div className='dégradé-de-surface' />
      <div className='flex justify-between'>
        <p className='fr-text--xs texte-gris fr-mb-0'>
          { contenu.valeurMin }
        </p>
        <p className='fr-text--xs texte-gris fr-mb-0'>
          { contenu.valeurMax }
        </p>
      </div>
    </CartographieLégendeDégradéStyled>
  );
};

export default CartographieLégendeDégradé;
