/* eslint-disable unicorn/consistent-function-scoping */
import { régionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { Territoire } from '@/client/stores/useTerritoiresStore/useTerritoiresStore.interface';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import { CartographieTerritoireAffiché, CartographieOptions, CartographieTerritoires } from './useCartographie.interface';
import { CartographieDonnées } from './Cartographie.interface';

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
        remplissage: données[territoire.codeInsee]?.remplissage ?? remplissageParDéfaut.couleur, //TODO gestion 0 chantiersFiltrés
        libellé: données[territoire.codeInsee]?.libellé ?? '', //TODO gestion 0 chantiersFiltrés
        valeurAffichée: données[territoire.codeInsee]?.valeurAffichée ?? 'NON_RENSEIGNÉE', //TODO gestion 0 chantiersFiltrés
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
    territoireSélectionnable: false,
  };
  

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
  };
}
