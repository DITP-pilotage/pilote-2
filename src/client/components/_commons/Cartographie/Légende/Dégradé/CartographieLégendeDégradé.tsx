import CartographieLégendeDégradéStyled from './CartographieLégendeDégradé.styled';
import CartographieLégendeDégradéProps from './CartographieLégendeDégradé.interface';

export default function CartographieLégendeDégradé({ contenu }: CartographieLégendeDégradéProps) {
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
}
