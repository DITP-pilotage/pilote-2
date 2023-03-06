/* eslint-disable unicorn/consistent-function-scoping */
import { actionsTerritoiresStore, régionsTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieTerritoireAffiché, CartographieOptions, CartographieTerritoires } from './useCartographie.interface';
import { CartographieDonnées } from './Cartographie.interface';

export default function useCartographie() {
  const régions = régionsTerritoiresStore();
  const { modifierTerritoireSélectionné, modifierTerritoiresComparés } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
    return territoireAffiché.maille === 'régionale'
      ? régions.filter(région => région.codeInsee === territoireAffiché.codeInsee)
      : régions;
  }

  function créerTerritoires(
    territoiresÀTracer: TerritoireGéographique[],
    frontièresÀTracer: TerritoireGéographique[],
    données: CartographieDonnées,
  ): CartographieTerritoires {
    return {
      territoires: territoiresÀTracer.map(territoire => ({
        codeInsee: territoire.codeInsee,
        tracéSVG: territoire.tracéSVG,
        remplissage: données[territoire.codeInsee]?.remplissage ?? '#bababa', // TODO où gérer ce undefined ?
        libellé: données[territoire.codeInsee]?.libellé ?? '-', // TODO où gérer ce undefined ?
        valeurAffichée: données[territoire.codeInsee]?.valeurAffichée ?? 'Non renseignée', // TODO où gérer ce undefined ?
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
    multiséléction: false,
  };

  function auClicTerritoireCallback(territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) {
    if (!territoireSélectionnable) return;

    if (territoireSélectionné.codeInsee === territoireCodeInsee)
      modifierTerritoireSélectionné('FR');
    else 
      modifierTerritoireSélectionné(territoireCodeInsee);
  }

  function auClicTerritoireMultiSélectionCallback(territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) {
    if (!territoireSélectionnable) return;
    modifierTerritoiresComparés(territoireCodeInsee);
  }

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
    auClicTerritoireCallback,
    auClicTerritoireMultiSélectionCallback,
  };
}
