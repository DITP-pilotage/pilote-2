import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import { couleurParDéfaut } from '@/client/constants/nuanciers/nuancier';
import CartographieMétéoProps from './CartographieMétéo.interface';
import CartographieMétéoStyled from './CartographieMétéo.styled';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';


function couleurDeRemplissage(valeurMétéo: CartographieValeur) {
  return valeurMétéo && typeof valeurMétéo === 'string' 
    ? nuancierMétéo.find(({ valeur }) => valeur === valeurMétéo)?.couleur || couleurParDéfaut
    : couleurParDéfaut;
}
  
function formaterValeur(valeurMétéo: CartographieValeur) {
  if (valeurMétéo === 'NON_RENSEIGNEE') return 'Non renseignée';
  if (valeurMétéo === 'NON_NECESSAIRE') return 'Non nécessaire';

  return valeurMétéo && typeof valeurMétéo === 'string' 
    ? pictosMétéos[valeurMétéo as keyof typeof pictosMétéos].nom
    : 'Non renseignée';
}

export default function CartographieMétéo({ données, niveauDeMaille, options }: CartographieMétéoProps) {
  return (
    <CartographieMétéoStyled>
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
        nuancierMétéo.map(({ couleur, libellé, picto }) => ({
          libellé,
          picto,
          couleur,
        }))
      }
        />
      </Cartographie>
    </CartographieMétéoStyled>
  );
}
