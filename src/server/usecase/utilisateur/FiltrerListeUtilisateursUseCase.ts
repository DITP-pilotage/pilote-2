import { FiltresUtilisateursActifs } from '@/client/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore.interface';
import { PROFILS_POSSIBLES_COORDINATEURS_LECTURE } from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import Utilisateur, { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class FiltrerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurs: Utilisateur[],
    private readonly filtresActifs: FiltresUtilisateursActifs,
    private readonly profil: ProfilCode,
    private readonly habilitation: Habilitation,
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

    return utilisateur.habilitations.lecture.périmètres.some((périmètre) => this.filtresActifs.périmètresMinistériels.includes(périmètre)) || 
      utilisateur.habilitations.lecture.chantiers.some((chantier) => this.filtresActifs.chantiersAssociésAuxPérimètres.includes(chantier));
  }

  private utilisateurPasseLeFiltreChantier(utilisateur: Utilisateur) {
    if (this.filtresActifs.chantiers.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.chantiers.some((chantier) => this.filtresActifs.chantiers.includes(chantier));
  }

  private utilisateurPasseLeFiltreProfil(utilisateur: Utilisateur) {
    if (this.filtresActifs.profils.length === 0) {
      return true;
    }

    return this.filtresActifs.profils.includes(utilisateur.profil);
  }

  private utilisateurPasseLesFiltres(utilisateur: Utilisateur) {
    return this.utilisateurPasseLeFiltreTerritoire(utilisateur)
      && this.utilisateurPasseLeFiltreChantier(utilisateur)
      && this.utilisateurPasseLeFiltrePérimètreMinistériel(utilisateur)
      && this.utilisateurPasseLeFiltreProfil(utilisateur);
  }

  private profilEstAutorisé(utilisateur: Utilisateur) {
    return PROFILS_POSSIBLES_COORDINATEURS_LECTURE[this.profil as keyof typeof PROFILS_POSSIBLES_COORDINATEURS_LECTURE].includes(utilisateur.profil);
  }

  private territoireEstAutorisé(utilisateur: Utilisateur) {
    return utilisateur.habilitations.lecture.territoires.some(territoire => this.habilitation.peutAccéderAuTerritoire(territoire));
  }

  private utilisateurEstAutorisé(utilisateur: Utilisateur) {
    if (!Object.keys(PROFILS_POSSIBLES_COORDINATEURS_LECTURE).includes(this.profil))
      return true;
    
    return this.profilEstAutorisé(utilisateur) && this.territoireEstAutorisé(utilisateur);
  }

  run() {
    return this.utilisateurs.filter(utilisateur => this.utilisateurPasseLesFiltres(utilisateur) && this.utilisateurEstAutorisé(utilisateur));
  }
}
