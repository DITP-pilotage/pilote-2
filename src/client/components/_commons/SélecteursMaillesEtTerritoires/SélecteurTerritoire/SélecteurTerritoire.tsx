import { useSession } from 'next-auth/react';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface SélecteurTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
}

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined, chantierMailles? : Chantier['mailles']) => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSélectionnée);

  let options = [];
  if (territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) {
    options.push({
      libellé: profil === 'DROM' ? 'Ensemble des 5 DROM' : 'France',
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

export default function SélecteurTerritoire({ chantierMailles }: SélecteurTerritoiresProps) {
  const { data: session } = useSession();
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();
  
  return (
    <SélecteurAvecRecherche
      htmlName='périmètre-géographique'
      libellé='Périmètre géographique'
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil, chantierMailles)}
      valeurModifiéeCallback={territoireCode => modifierTerritoireSélectionné(territoireCode)}
      valeurSélectionnée={territoireSélectionné?.code}
    />
  );
}
