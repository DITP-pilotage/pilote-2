import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';
import CartographieAffichage from '../CartographieAffichage/CartographieAffichage';

export default function CartographieTauxAvancement({ données, options }: CartographieTauxAvancementProps) {
  return (
    <CartographieAffichage
      données={données}
      options={options}
    >
      <CartographieLégende élémentsDeLégende={nuancierPourcentage.map(({ remplissage, libellé }) => ({
        libellé,
        remplissage,
      }))}
      />
    </CartographieAffichage>
  );
}
