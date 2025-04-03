import { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Chantier from '@/server/chantiers/domain/Chantier.interface';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';
import {
  InputGroupeOptionGroupée,
  InputGroupeOptions,
  InputGroupeOptionsGroupées,
} from '@/components/_commons/InputGroupe/InputGroupe.interface';
import { MultiSelectOption } from '@/components/_commons/MultiSelect/MultiSelect.interface';
import InputGroupeTerritoire from '@/components/_commons/InputGroupe/InputGroupeTerritoire/InputGroupeTerritoire';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

interface SélecteursMaillesEtTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
  territoireCode: string
  pathname: string
}

const générerLesOptions = (nom: string, code: string, disabled: boolean): MultiSelectOption => ({
  label: nom,
  value: code,
  disabled,
});

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined, chantierMailles?: Chantier['mailles']) => {
  const territoiresDisponiblesDept = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === 'departementale');
  const territoiresDisponiblesReg = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === 'regionale');

  const optionsRégions = {
    label: 'Régions',
    options: trierParOrdreAlphabétique<InputGroupeOptions>(territoiresDisponiblesReg.map(region => générerLesOptions(region.nomAffiché, region.code, !!chantierMailles ? !chantierMailles['regionale'][region.code].estApplicable ?? true : false)), 'label'),
  };

  const optionsDépartements = {
    label: 'Départements',
    options: trierParOrdreAlphabétique<InputGroupeOptions>(territoiresDisponiblesDept.map(departement => générerLesOptions(departement.nomAffiché, departement.code, !!chantierMailles ? !chantierMailles['departementale'][departement.code].estApplicable ?? true : false)), 'label'),
  };

  return [
    optionsRégions,
    optionsDépartements,
  ].filter((option): option is InputGroupeOptionGroupée => option !== null) satisfies InputGroupeOptionsGroupées;
};

const SélecteursMaillesEtTerritoires: FunctionComponent<SélecteursMaillesEtTerritoiresProps> = ({
  chantierMailles,
  territoireCode,
  pathname,
}) => {

  const router = useRouter();
  const { data: session } = useSession();

  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  const changerTerritoire = async (territoireCodeSelectionne: string) => {
    if (router.query.territoireCode === 'NAT-FR' || territoireCodeSelectionne === 'NAT-FR') {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }
    delete router.query.pageIndex;
    delete router.query._action;

    const { maille } = territoireCodeVersMailleCodeInsee(territoireCodeSelectionne);

    router.query.maille = maille === 'DEPT' ? 'departementale' : maille === 'REG' ? 'regionale' : router.query.maille;

    sauvegarderFiltres({ territoireCode: territoireCodeSelectionne });

    return router.push({
      pathname,
      query: { ...router.query, territoireCode: territoireCodeSelectionne },
    },
    undefined, {
      scroll: false,
    });
  };

  return (
    <InputGroupeTerritoire
      changementValeurSelectionneeCallback={(valeurSélectionne: string) => changerTerritoire(valeurSélectionne)}
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil, chantierMailles)}
      territoireCodeSelectionneParDefaut={territoireCode}
    />
  );
};

export default SélecteursMaillesEtTerritoires;
