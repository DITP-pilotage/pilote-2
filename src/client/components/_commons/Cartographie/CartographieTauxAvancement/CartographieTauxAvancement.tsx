import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { couleurParDéfaut } from '@/client/constants/nuanciers/nuancier';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';

function couleurDeRemplissage(valeurAvancement: CartographieValeur) {
  return valeurAvancement !== null && typeof valeurAvancement === 'number'
    ? nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeurAvancement)?.couleur || couleurParDéfaut
    : couleurParDéfaut;
}

function territoireHachuré(valeurAvancement: CartographieValeur) {
  return valeurAvancement !== null && typeof valeurAvancement === 'number'
    ? nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeurAvancement)?.hachures || false
    : false;
}
  
function formaterValeur(valeurAvancement: CartographieValeur) {
  return valeurAvancement !== null && typeof valeurAvancement === 'number' ? `${valeurAvancement.toFixed(0)}%` : 'Non renseigné';
}

export default function CartographieTauxAvancement({ données, niveauDeMaille, options }: CartographieTauxAvancementProps) {
  return (
    <Cartographie 
      données={données} 
      niveauDeMaille={niveauDeMaille}
      options={{
        couleurDeRemplissage,
        formaterValeur,
        territoireHachuré,
        ...options,
      }}
    >
      <CartographieLégende élémentsDeLégende={
        nuancierPourcentage.map(({ couleur, libellé, hachures }) => ({
          libellé,
          couleur,
          hachures,
        }))
      }
      />
    </Cartographie>
  );
}
