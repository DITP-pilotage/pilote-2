/* eslint-disable unicorn/consistent-function-scoping */
import { useRouter } from 'next/router';
import {
  actionsTerritoiresStore,
  régionsTerritoiresStore,
  territoiresAccessiblesEnLectureStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee, DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import {
  CartographieOptions,
  CartographieTerritoireAffiché,
  CartographieTerritoires,
} from './useCartographie.interface';
import { CartographieDonnées } from './Cartographie.interface';

export default function useCartographie(territoireCode: string, mailleSelectionnee: 'départementale' | 'régionale') {
  const régions = régionsTerritoiresStore();
  const { modifierTerritoiresComparés, récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  const router = useRouter();

  const [, codeInsee] = territoireCode.split('-');

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
    if (!territoireSélectionnable) return;

    let code =  (codeInsee === territoireCodeInsee && territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) ? 'NAT-FR' : mailleSelectionnee === 'départementale' ? `DEPT-${territoireCodeInsee}` : `REG-${territoireCodeInsee}`;

    if (router.query.territoireCode === 'NAT-FR' || code === 'NAT-FR') {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }

    if (router.query.territoireCode === code) {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
      code = 'NAT-FR';
    }

    return router.push({
      pathname: '/accueil/chantier/[territoireCode]',
      query: { ...router.query, territoireCode: code },
    },
    undefined,
    {},
    );
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
