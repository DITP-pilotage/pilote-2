import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import CartographieMétéoProps from './CartographieMétéo.interface';
import CartographieMétéoStyled from './CartographieMétéo.styled';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';


function couleurDeRemplissage(valeurMétéo: CartographieValeur) {
  return valeurMétéo && typeof valeurMétéo === 'string' 
    ? nuancierMétéo.find(({ valeur }) => valeur === valeurMétéo)?.couleur || '#BABABA'
    : '#BABABA';

}
  
function formaterValeur(valeur: CartographieValeur) {
  if (valeur === 'NON_RENSEIGNEE') return 'Non renseignée';
  if (valeur === 'NON_NECESSAIRE') return 'Non nécessaire';

  return valeur && typeof valeur === 'string' 
    ? pictosMétéos[valeur as keyof typeof pictosMétéos].nom
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
