import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import CartographieMétéoProps from './CartographieMétéo.interface';
import CartographieMétéoStyled from './CartographieMétéo.styled';
import useCartographieMétéo from './useCartographieMétéo';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';
import CartographieAffichage from '../CartographieAffichage/CartographieAffichage';

export default function CartographieMétéo({ données, mailleInterne, options }: CartographieMétéoProps) {
  const { déterminerRemplissage, formaterValeur } = useCartographieMétéo();
  return (
    <CartographieMétéoStyled>
      <CartographieAffichage
        données={données}
        niveauDeMaille={mailleInterne}
        options={{
          déterminerRemplissage,
          formaterValeur,
          ...options,
        }}
      >
        <CartographieLégende élémentsDeLégende={nuancierMétéo.map(({ remplissage, libellé, picto }) => ({ 
          libellé, 
          remplissage,
          picto,
        }))}
        />
      </CartographieAffichage>
    </CartographieMétéoStyled>
  );
}
