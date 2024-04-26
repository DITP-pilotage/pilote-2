import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { UtilisateurListeGestion } from '@/server/app/contrats/UtilisateurListeGestion';

export default class RécupérerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
  ) {}

  async run({
    sorting,
    valeurDeLaRecherche,
  }: {
    sorting: { id: string, desc: boolean }[],
    valeurDeLaRecherche: string
  }): Promise<UtilisateurListeGestion[]> {
    return this.utilisateurRepository.récupérerTousNew({
      sorting,
      valeurDeLaRecherche,
    });
  }
}
