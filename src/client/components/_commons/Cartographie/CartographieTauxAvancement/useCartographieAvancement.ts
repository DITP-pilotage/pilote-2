/* eslint-disable unicorn/consistent-function-scoping */
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { CartographieValeur } from '../useCartographie';

export default function useCartographieAvancement() {
  function déterminerRemplissage(valeurAvancement: CartographieValeur) {
    return valeurAvancement !== null && typeof valeurAvancement === 'number'
      ? nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeurAvancement)?.remplissage || remplissageParDéfaut
      : remplissageParDéfaut;
  }
        
  function formaterValeur(valeurAvancement: CartographieValeur) {
    return valeurAvancement !== null && typeof valeurAvancement === 'number' ? `${valeurAvancement.toFixed(0)}%` : 'Non renseigné';
  }
  
  return { déterminerRemplissage, formaterValeur };
}
