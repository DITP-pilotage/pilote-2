import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import Utilisateur, {
  UtilisateurÀCréerOuMettreÀJourSansHabilitation,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { HabilitationsÀCréerOuMettreÀJourCalculées } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

export class RecupererListeUtilisateursExistantsUseCase {
  constructor(private readonly utilisateurRepository: UtilisateurRepository) {}

  async run(
    utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    })[],
  ): Promise<Utilisateur["email"][]> {
    return this.utilisateurRepository.récupérerExistants(utilisateurs);
  }
}
