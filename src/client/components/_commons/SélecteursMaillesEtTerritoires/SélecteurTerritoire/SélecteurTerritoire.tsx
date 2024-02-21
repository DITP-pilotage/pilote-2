import { useSession } from 'next-auth/react';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined) => {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  console.log('helllo')
  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSélectionnée);
  
  let options = [];
  if (territoiresAccessiblesEnLecture.some(territoire => territoire.maille === 'nationale')) {
    options.push({
      libellé: profil === 'DROM' ? 'Ensemble des 5 DROM' : 'France',
      valeur: 'NAT-FR',
    });
  }

  return [
    ...options, 
    ...territoiresDisponibles.sort((a, b) => a.codeInsee < b.codeInsee ? -1 : 1).map(territoire => ({
      libellé: territoire.nomAffiché,
      valeur: territoire.code,
    })),
  ];
};

export default function SélecteurTerritoire() {
  const { data: session } = useSession();
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();
  
  return (
    <SélecteurAvecRecherche
      htmlName='périmètre-géographique'
      libellé='Périmètre géographique'
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil)}
      valeurModifiéeCallback={territoireCode => modifierTerritoireSélectionné(territoireCode)}
      valeurSélectionnée={territoireSélectionné?.code}
    />
  );
}
