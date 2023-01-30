import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';

function couleurDeRemplissage(valeur: CartographieValeur) {
  return valeur && typeof valeur === 'number'
    ? nuancierPourcentage.find(({ seuil }) => seuil >= valeur)?.couleur || '#dedede'
    : '#dedede';
}
  
function formaterValeur(valeur: CartographieValeur) {
  return valeur && typeof valeur === 'number' ? `${valeur.toFixed(0)}%` : 'Non renseigné';
}


export default function CartographieTauxAvancement({ données, niveauDeMaille, options }: CartographieTauxAvancementProps) {
  return (
    <Cartographie 
      données={données} 
      niveauDeMaille={niveauDeMaille}
      options={{
        couleurDeRemplissage,
        formaterValeur,
        ...options,
      }}
    >
      <CartographieLégende élémentsDeLégende={
        nuancierPourcentage.map(({ couleur, libellé }) => ({
          libellé,
          couleur,
        }))
      }
      />
    </Cartographie>
  );
}
