import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { filtresUtilisateursActifs } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';

export function usePageAdminUtilisateurs(utilisateurs: Utilisateur[]) {
  const filtresActifs = filtresUtilisateursActifs();

  function passeLesFiltres(utilisateur: Utilisateur) {
    if (filtresActifs.territoires.length === 0) {
      return true;
    }
    return utilisateur.habilitations.lecture.territoires.some((territoire) => filtresActifs.territoires.includes(territoire));
  }

  return {
    utilisateursFiltrés: utilisateurs.filter(passeLesFiltres),
  };
}
