import { FiltresUtilisateursActifs } from '@/client/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class FiltrerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurs: Utilisateur[],
    private readonly filtresActifs: FiltresUtilisateursActifs,
  ) {}

  private utilisateurPasseLeFiltreTerritoire(utilisateur: Utilisateur) {
    if (this.filtresActifs.territoires.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.territoires.some((territoire) => this.filtresActifs.territoires.includes(territoire));
  }

  private utilisateurPasseLeFiltrePérimètreMinistériel(utilisateur: Utilisateur) {
    if (this.filtresActifs.périmètresMinistériels.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.périmètres.some((périmètre) => this.filtresActifs.périmètresMinistériels.includes(périmètre));
  }

  private utilisateurPasseLeFiltreChantier(utilisateur: Utilisateur) {
    if (this.filtresActifs.chantiers.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.chantiers.some((chantier) => this.filtresActifs.chantiers.includes(chantier));
  }

  private utilisateurPasseLesFiltres(utilisateur: Utilisateur) {
    return this.utilisateurPasseLeFiltreTerritoire(utilisateur)
      && this.utilisateurPasseLeFiltreChantier(utilisateur)
      && this.utilisateurPasseLeFiltrePérimètreMinistériel(utilisateur);
  }

  run() {
    return this.utilisateurs.filter(utilisateur => this.utilisateurPasseLesFiltres(utilisateur));
  }
}
