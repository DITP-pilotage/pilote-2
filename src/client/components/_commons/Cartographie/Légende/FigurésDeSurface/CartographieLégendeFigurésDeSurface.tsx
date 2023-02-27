import CartographieLégendeFigurésDeSurfaceProps from './CartographieLégendeFigurésDeSurface.interface';
import CartographieLégendeFigurésDeSurfaceStyled from './CartographieLégendeFigurésDeSurface.styled';
import CartographieLégendeFiguréDeSurfaceÉlément from './Élément/CartographieLégendeFiguréDeSurfaceÉlément';

export default function CartographieLégendeFigurésDeSurface({ légende }: CartographieLégendeFigurésDeSurfaceProps) {
  return (
    <CartographieLégendeFigurésDeSurfaceStyled className="fr-mt-1w fr-mb-0 fr-pl-1w">
      {
        légende.map(({ remplissage, libellé, picto }) => (
          <CartographieLégendeFiguréDeSurfaceÉlément
            key={`carto-légende-${libellé}`}
            remplissage={remplissage}
          >
            <span>
              {libellé}
            </span>
            {picto ?? null}
          </CartographieLégendeFiguréDeSurfaceÉlément>
        ))
      }
    </CartographieLégendeFigurésDeSurfaceStyled>
  );
}
