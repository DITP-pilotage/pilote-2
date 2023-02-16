import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';
import CartographieAffichage from '../CartographieAffichage/CartographieAffichage';

export default function CartographieTauxAvancement({ données, niveauDeMaille, options }: CartographieTauxAvancementProps) {
  const { déterminerRemplissage, formaterValeur } = useCartographieAvancement();
  return (
    <CartographieAffichage
      données={données}
      niveauDeMaille={niveauDeMaille}
      options={{
        déterminerRemplissage,
        formaterValeur,
        ...options,
      }} 
    >
      <CartographieLégende élémentsDeLégende={nuancierPourcentage.map(({ remplissage, libellé }) => ({ 
        libellé, 
        remplissage,
      }))}
      />
    </CartographieAffichage>
  );
}
