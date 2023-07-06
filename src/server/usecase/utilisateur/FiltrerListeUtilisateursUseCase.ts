import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class FiltrerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurs: Utilisateur[],
    private readonly filtresActifs: string[],
  ) {}

  private passeLesFiltres(utilisateur: Utilisateur) {
    if (this.filtresActifs.length === 0) {
      return true;
    }
  
    return utilisateur.habilitations.lecture.territoires.some((territoire) => this.filtresActifs.includes(territoire));
  }

  run() {
    return this.utilisateurs.filter(elem => this.passeLesFiltres(elem));
  }
}
