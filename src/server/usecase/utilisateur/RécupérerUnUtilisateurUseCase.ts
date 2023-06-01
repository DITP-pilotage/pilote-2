import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
  ) {}

  async run(habilitations: Habilitations, utilisateurId: Utilisateur['id']): Promise<Utilisateur | null> {
    const habilitation = new Habilitation(habilitations);
    const utilisateur = await this.utilisateurRepository.getById(utilisateurId);

    if (!utilisateur) {
      return null;
    }
    
    const peutConsulterLUtilisateur = habilitation.peutConsulterUnUtilisateur(
      utilisateur.habilitations.lecture.chantiers,
      utilisateur.habilitations.lecture.territoires);

    return peutConsulterLUtilisateur ? utilisateur : null;
  }
}
