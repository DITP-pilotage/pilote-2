import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { actionsTerritoiresStore, territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default function usePageUtilisateur(utilisateur: Utilisateur, chantiers: Record<Chantier['id'], Chantier['nom']>) {

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const tousLesTerritoires = territoiresTerritoiresStore();
  const territoiresLectureUtilisateur = utilisateur.habilitations.lecture.territoires;
  const chantiersLectureUtilisateur = utilisateur.habilitations.lecture.chantiers;
  let listeTerritoiresEnLecture: string[] = [];
  let listeChantiersEnLecture: string[] = [];

  listeTerritoiresEnLecture = territoiresLectureUtilisateur.length === tousLesTerritoires.length
    ? ['Tous']
    : territoiresLectureUtilisateur.map(territoire => récupérerDétailsSurUnTerritoire(territoire).nomAffiché);

  listeChantiersEnLecture = chantiersLectureUtilisateur.length === Object.keys(chantiers).length
    ? ['Tous']
    : chantiersLectureUtilisateur.map(chantierId => chantiers[chantierId]);


  return {
    listeTerritoiresEnLecture,
    listeChantiersEnLecture,
  };
}
