/* eslint-disable unicorn/consistent-function-scoping */
import { régionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import {
  CartographieDonnées,
} from '@/components/_commons/Cartographie/CartographieTauxAvancement/CartographieTauxAvancement.interface';
import { Territoire } from '@/client/stores/useTerritoiresStore/useTerritoiresStore.interface';
import { CartographieTerritoireAffiché, CartographieOptions, CartographieTerritoires } from './useCartographie.interface';

export default function useCartographie() {
  const régions = régionsTerritoiresStore();
  
  function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
    return territoireAffiché.maille === 'régionale'
      ? régions.filter(région => région.codeInsee === territoireAffiché.codeInsee)
      : régions;
  }

  function créerTerritoires(
    territoiresÀTracer: Territoire[],
    frontièresÀTracer: Territoire[],
    données: CartographieDonnées,
  ): CartographieTerritoires {
    return {
      territoires: territoiresÀTracer.map(territoire => ({
        codeInsee: territoire.codeInsee,
        tracéSVG: territoire.tracéSVG,
        remplissage: données[territoire.codeInsee].remplissage,
        libellé: données[territoire.codeInsee].libellé,
        valeurAffichée: données[territoire.codeInsee].valeurAffichée,
      })),
      frontières: frontièresÀTracer.map(frontière => ({
        codeInsee: frontière.codeInsee,
        tracéSVG: frontière.tracéSVG,
      })),
    };
  }
    
  const optionsParDéfaut: CartographieOptions = {
    territoireAffiché: {
      codeInsee: 'FR',
      maille: 'nationale',
    },
    déterminerRemplissage: () => remplissageParDéfaut,
    formaterValeur: (valeur) => valeur ? String(valeur) : '-',
    territoireSélectionnable: false,
  };
  

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
  };
}
