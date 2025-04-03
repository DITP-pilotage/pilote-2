import { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from '@/server/domain/utilisateur/Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';

export class RecupererListeUtilisateursExistantsUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
  ) {}

  async run(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]> {
    return this.utilisateurRepository.récupérerExistants(utilisateurs);
  }
}
