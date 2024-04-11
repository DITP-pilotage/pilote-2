import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { territoiresAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface SélecteurTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
}

const construireLaListeDOptions = (territoiresAccessiblesEnLecture: DétailTerritoire[], profil: ProfilCode | undefined, mailleSelectionnee: 'départementale' | 'régionale', chantierMailles? : Chantier['mailles']) => {
  const territoiresDisponibles = territoiresAccessiblesEnLecture.filter(territoire => territoire.maille === mailleSelectionnee);

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

export default function SélecteurTerritoire({ chantierMailles, territoireCode, mailleSelectionnee }: SélecteurTerritoiresProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const modifierTerritoireSélectionné = async (territoireCodeSelectionne: string) => {
    router.query.territoireCode = territoireCodeSelectionne;
    router.push({
      pathname: '/accueil/chantier/[territoireCode]',
      query: { ...router.query } },
    undefined,
    {},
    );

  };

  const territoiresAccessiblesEnLecture = territoiresAccessiblesEnLectureStore();
  
  return (
    <SélecteurAvecRecherche
      htmlName='périmètre-géographique'
      libellé='Périmètre géographique'
      options={construireLaListeDOptions(territoiresAccessiblesEnLecture, session?.profil, mailleSelectionnee, chantierMailles)}
      valeurModifiéeCallback={territoireCodeSelectionne => modifierTerritoireSélectionné(territoireCodeSelectionne)}
      valeurSélectionnée={territoireCode}
    />
  );
}
