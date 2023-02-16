/* eslint-disable unicorn/consistent-function-scoping */
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import { libellésMétéos } from '@/server/domain/chantier/Météo.interface';
import { CartographieValeur } from '@/components/_commons/Cartographie/useCartographie.interface';
import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';

export default function useCartographieMétéo() {
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

  return { déterminerRemplissage, formaterValeur };
}
