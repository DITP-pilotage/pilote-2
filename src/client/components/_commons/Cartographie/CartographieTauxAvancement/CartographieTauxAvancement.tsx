import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';

function couleurDeRemplissage(valeur: CartographieValeur) {
  return valeur
    ? nuancierPourcentage.find(({ seuil }) => seuil >= valeur)?.couleur || '#dedede'
    : '#dedede';
}
  
function formaterValeur(valeur: CartographieValeur) {
  return valeur ? `${valeur.toFixed(0)}%` : 'Non renseigné';
}

export default function CartographieTauxAvancement({ données }: CartographieTauxAvancementProps) {
  return (
    <Cartographie 
      données={données} 
      niveauDeMailleAffiché="départementale"
      options={{
        couleurDeRemplissage,
        formaterValeur,
      }}
      territoireAffiché={{
        codeInsee: 'FR',
        divisionAdministrative: 'france',
      }}
    >
      <CartographieLégende nuancier={nuancierPourcentage} />
    </Cartographie>
  );
}
