import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FunctionComponent } from 'react';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';

interface SélecteurTerritoiresProps {
  chantierMailles?: Chantier['mailles'],
  territoireCode: string,
  mailleSelectionnee: 'départementale' | 'régionale',
  pathname: string
  estVueMobile: boolean,
  estVisibleEnMobile: boolean,
}

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined, mailleSelectionnee: 'départementale' | 'régionale', chantierMailles?: Chantier['mailles']) => {
  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSelectionnee);

  let options = [];
  if (territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) {
    options.push({
      libellé: profil === ProfilEnum.DROM ? 'Ensemble des 5 DROM' : 'France',
      valeur: 'NAT-FR',
      désactivée: !!chantierMailles ? !chantierMailles.nationale['FR'].estApplicable ?? true : false,
    });
  }

  return [
    ...options,
    ...territoiresDisponibles.sort((a, b) => a.codeInsee < b.codeInsee ? -1 : 1).map(territoire => ({
      libellé: territoire.nomAffiché,
      valeur: territoire.code,
      désactivée: !!chantierMailles ? !chantierMailles[territoire.maille][territoire.codeInsee].estApplicable ?? true : false,
    })),
  ];
};

const SélecteurTerritoire: FunctionComponent<SélecteurTerritoiresProps> = ({
  chantierMailles,
  territoireCode,
  mailleSelectionnee,
  pathname,
  estVueMobile,
  estVisibleEnMobile,
}) => {
  const { data: session } = useSession();
  const router = useRouter();

  const changerTerritoire = async (territoireCodeSelectionne: string) => {
    if (router.query.territoireCode === 'NAT-FR' || territoireCodeSelectionne === 'NAT-FR') {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }
    sauvegarderFiltres({ territoireCode: territoireCodeSelectionne });

    return router.push({
      pathname,
      query: { ...router.query, territoireCode: territoireCodeSelectionne },
    },
    undefined,
    {},
    );
  };

  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  return (
    <SélecteurAvecRecherche
      estVisibleEnMobile={estVisibleEnMobile}
      estVueMobile={estVueMobile}
      htmlName='Territoire'
      libellé='Territoire'
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil, mailleSelectionnee, chantierMailles)}
      valeurModifiéeCallback={territoireCodeSelectionne => changerTerritoire(territoireCodeSelectionne)}
      valeurSélectionnée={territoireCode}
    />
  );
};

export default SélecteurTerritoire;
