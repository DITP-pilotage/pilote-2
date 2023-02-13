import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import { libellésMétéos } from '@/server/domain/chantier/Météo.interface';
import CartographieMétéoProps from './CartographieMétéo.interface';
import CartographieMétéoStyled from './CartographieMétéo.styled';
import Cartographie from '../Cartographie';
import { CartographieValeur } from '../CartographieAffichage/CartographieAffichage.interface';
import CartographieLégende from '../CartographieAffichage/Légende/CartographieLégende';


function déterminerRemplissage(valeurMétéo: CartographieValeur) {
  return valeurMétéo && typeof valeurMétéo === 'string' 
    ? nuancierMétéo.find(({ valeur }) => valeur === valeurMétéo)?.remplissage || remplissageParDéfaut
    : remplissageParDéfaut;
}

function formaterValeur(valeurMétéo: CartographieValeur) {
  if (valeurMétéo === 'NON_RENSEIGNEE') return 'Non renseignée';
  if (valeurMétéo === 'NON_NECESSAIRE') return 'Non nécessaire';

  return valeurMétéo && typeof valeurMétéo === 'string' 
    ? libellésMétéos[valeurMétéo as keyof typeof pictosMétéos]
    : 'Non renseignée';
}

export default function CartographieMétéo({ données, mailleInterne, options }: CartographieMétéoProps) {
  return (
    <CartographieMétéoStyled>
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
        nuancierMétéo.map(({ remplissage, libellé, picto }) => ({
          libellé,
          picto,
          remplissage,
        }))
      }
        />
      </Cartographie>
    </CartographieMétéoStyled>
  );
}
