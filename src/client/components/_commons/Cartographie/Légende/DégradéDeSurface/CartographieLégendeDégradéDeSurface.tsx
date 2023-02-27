import CartographieLégendeDégradéDeSurfaceProps
  from '@/components/_commons/Cartographie/Légende/DégradéDeSurface/CartographieLégendeDégradéDeSurfaceProps.interface';
import CartographieLégendeDégradéDeSurfaceStyled from './CartographieLégendeDégradéDeSurface.styled';

export default function CartographieLégendeDégradéDeSurface({ contenu }: CartographieLégendeDégradéDeSurfaceProps) {
  return (
    <CartographieLégendeDégradéDeSurfaceStyled
      className='fr-mt-1w'
      couleurMax={contenu.couleurMax}
      couleurMin={contenu.couleurMin}
    >
      <p className="fr-text--xs texte-gris fr-mb-0">
        { contenu.libelléUnité }
      </p>
      <div className="dégradé-de-surface" />
      <div className="flex justifyBetween">
        <p className="fr-text--xs texte-gris fr-mb-0">
          { contenu.valeurMin }
        </p>
        <p className="fr-text--xs texte-gris fr-mb-0">
          { contenu.valeurMax }
        </p>
      </div>
    </CartographieLégendeDégradéDeSurfaceStyled>
  );
}
