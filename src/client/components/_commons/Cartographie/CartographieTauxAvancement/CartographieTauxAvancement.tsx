import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { couleurParDéfaut } from '@/client/constants/nuanciers/nuancier';
import CartographieTauxAvancementProps from './CartographieTauxAvancement.interface';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';

function couleurDeRemplissage(valeurAvancement: CartographieValeur) {
  return valeurAvancement && typeof valeurAvancement === 'number'
    ? nuancierPourcentage.find(({ seuil }) => seuil && seuil >= valeurAvancement)?.couleur || couleurParDéfaut
    : couleurParDéfaut;
}
  
function formaterValeur(valeurAvancement: CartographieValeur) {
  return valeurAvancement && typeof valeurAvancement === 'number' ? `${valeurAvancement.toFixed(0)}%` : 'Non renseigné';
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
