/* eslint-disable unicorn/consistent-function-scoping */
import {
  actionsTerritoiresStore,
  régionsTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
  territoiresAccessiblesEnLectureStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee, DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { CartographieTerritoireAffiché, CartographieOptions, CartographieTerritoires } from './useCartographie.interface';
import { CartographieDonnées } from './Cartographie.interface';

export default function useCartographie() {
  const régions = régionsTerritoiresStore();
  const { modifierTerritoireSélectionné, modifierTerritoiresComparés, récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
    return territoireAffiché.maille === 'régionale'
      ? régions.filter(région => région.codeInsee === territoireAffiché.codeInsee)
      : régions;
  }

  function créerTerritoires(
    territoiresÀTracer: DétailTerritoire[],
    frontièresÀTracer: DétailTerritoire[],
    données: CartographieDonnées,
  ): CartographieTerritoires {
    return {
      territoires: territoiresÀTracer.map(territoire => ({
        codeInsee: territoire.codeInsee,
        tracéSVG: territoire.tracéSvg,
        remplissage: données[territoire.codeInsee]?.remplissage ?? '#bababa', // TODO où gérer ce undefined ?
        libellé: données[territoire.codeInsee]?.libellé ?? '-', // TODO où gérer ce undefined ?
        valeurAffichée: données[territoire.codeInsee]?.valeurAffichée ?? 'Non renseignée', // TODO où gérer ce undefined ?
        estInteractif: territoire.accèsLecture,
      })),
      frontières: frontièresÀTracer.map(frontière => ({
        codeInsee: frontière.codeInsee,
        tracéSVG: frontière.tracéSvg,
      })),
    };
  }

  const optionsParDéfaut: CartographieOptions = {
    territoireAffiché: {
      codeInsee: 'FR',
      maille: 'nationale',
    },
    territoireSélectionnable: true,
    multiséléction: false,
    estInteractif: true,
  };

  function auClicTerritoireCallback(territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) {
    if (!territoireSélectionnable || !territoireSélectionné) return;

    if (territoireSélectionné.codeInsee === territoireCodeInsee && territoiresAccessiblesEnLecture.some(t => t.maille === 'nationale'))
      modifierTerritoireSélectionné('NAT-FR');
    else 
      modifierTerritoireSélectionné(récupérerDétailsSurUnTerritoireAvecCodeInsee(territoireCodeInsee).code);
  }

  function auClicTerritoireMultiSélectionCallback(territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) {
    if (!territoireSélectionnable) return;
    modifierTerritoiresComparés(récupérerDétailsSurUnTerritoireAvecCodeInsee(territoireCodeInsee).code);
  }

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
    auClicTerritoireCallback,
    auClicTerritoireMultiSélectionCallback,
  };
}
