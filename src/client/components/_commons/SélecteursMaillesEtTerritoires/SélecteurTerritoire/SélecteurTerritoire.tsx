import { useSession } from 'next-auth/react';
import { FunctionComponent } from 'react';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoiresAccessiblesEnLectureStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

interface SélecteurTerritoiresProps {
  chantierMailles?: Chantier['mailles'],
  estVueMobile: boolean,
  estVisibleEnMobile: boolean,
}

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined, chantierMailles?: Chantier['mailles']) => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSélectionnée);

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

const SélecteurTerritoire: FunctionComponent<SélecteurTerritoiresProps> = ({ chantierMailles, estVueMobile, estVisibleEnMobile }) => {
  const { data: session } = useSession();
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();

  return (
    <SélecteurAvecRecherche
      estVisibleEnMobile={estVisibleEnMobile}
      estVueMobile={estVueMobile}
      htmlName={estVueMobile && estVisibleEnMobile ? 'Territoire' : 'périmètre-géographique'}
      libellé={estVueMobile && estVisibleEnMobile ? 'Territoire' : 'Périmètre géographique'}
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil, chantierMailles)}
      valeurModifiéeCallback={territoireCode => modifierTerritoireSélectionné(territoireCode)}
      valeurSélectionnée={territoireSélectionné?.code}
    />
  );
};

export default SélecteurTerritoire;
