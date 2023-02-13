import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';

function déterminerRemplissage(valeurAvancement: CartographieValeur) {
  return valeurAvancement !== null && typeof valeurAvancement === 'number'
    ? nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeurAvancement)?.remplissage || remplissageParDéfaut
    : remplissageParDéfaut;
}
  
function formaterValeur(valeurAvancement: CartographieValeur) {
  return valeurAvancement !== null && typeof valeurAvancement === 'number' ? `${valeurAvancement.toFixed(0)}%` : 'Non renseigné';
}

export default function CartographieTauxAvancement({ données, mailleInterne, options }: CartographieTauxAvancementProps) {
  return (
    <Cartographie 
      données={données} 
      mailleInterne={mailleInterne}
      options={{
        déterminerRemplissage,
        formaterValeur,
        ...options,
      }}
    >
      <CartographieLégende élémentsDeLégende={
        nuancierPourcentage.map(({ remplissage, libellé }) => ({
          libellé,
          remplissage,
        }))
      }
      />
    </Cartographie>
  );
}
