import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import créerValidateurHabilitations from '@/validation/habilitation';

export default class CréerOuMettreÀJourUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}

  async _validerLesHabilitations(utilisateur: UtilisateurÀCréerOuMettreÀJour) {
    const territoires = await this.territoireRepository.récupérerTous();

    const validateurHabilitations = await créerValidateurHabilitations(territoires);
    validateurHabilitations.parse(utilisateur);
  }

  async run(utilisateur: UtilisateurÀCréerOuMettreÀJour, auteurModification: string): Promise<void> {
    await this._validerLesHabilitations(utilisateur);

    await this.utilisateurRepository.créerOuMettreÀJour(utilisateur, auteurModification);

    if (!process.env.DEV_PASSWORD) {
      const utilisateursPourIAM = [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }];
      await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    }
  }
}
