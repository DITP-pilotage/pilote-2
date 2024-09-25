import { useRouter } from 'next/router';
import { parseAsString, useQueryState } from 'nuqs';
import {
  régionsTerritoiresStore,
  territoiresAccessiblesEnLectureStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee, DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import {
  CartographieOptions,
  CartographieTerritoireAffiché,
  CartographieTerritoires,
} from './useCartographie.interface';
import { CartographieDonnées } from './Cartographie.interface';

export default function useCartographie(territoireCode: string, mailleSelectionnee: MailleInterne, pathname: '/accueil/ppg/[territoireCode]' | '/ppg/[id]/[territoireCode]' | null) {
  const régions = régionsTerritoiresStore();
  const [territoiresCompares, setTerritoiresCompares] = useQueryState('territoiresCompares', parseAsString.withDefault('').withOptions({
    shallow: false,
    history: 'push',
    clearOnDefault: true,
  }));
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  const router = useRouter();

  const { codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

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
      pathname,
      query: { ...router.query, territoireCode: code },
    },
    undefined,
    {},
    );
  }

  function auClicTerritoireMultiSélectionCallback(territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) {
    if (!territoireSélectionnable) return;

    const listeTerritoiresCompares = territoiresCompares.split(',').filter(Boolean);

    if (codeInsee === territoireCodeInsee) {
      delete router.query.territoiresCompares;
      return auClicTerritoireCallback(territoireCodeInsee, territoireSélectionnable);
    }

    let territoireCompareCode =  (codeInsee === territoireCodeInsee && territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) ? 'NAT-FR' : mailleSelectionnee === 'départementale' ? `DEPT-${territoireCodeInsee}` : `REG-${territoireCodeInsee}`;

    if (listeTerritoiresCompares.includes(territoireCompareCode)) {
      listeTerritoiresCompares.splice(listeTerritoiresCompares.indexOf(territoireCompareCode), 1);
      setTerritoiresCompares(listeTerritoiresCompares.join(','));
    } else {
      setTerritoiresCompares([territoireCompareCode, ...listeTerritoiresCompares].join(','));
    }
  }

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
    auClicTerritoireCallback,
    auClicTerritoireMultiSélectionCallback,
  };
}
