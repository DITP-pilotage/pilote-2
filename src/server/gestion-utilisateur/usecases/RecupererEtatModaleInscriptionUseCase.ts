import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
};

export class RecupererEtatModaleInscriptionUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string): Promise<boolean> {
    const dateVisualisationVideoAccueil =
      await this.utilisateurRepository.recupererDateVisualisationVideoAccueil(
        utilisateurId,
      );
    const dateInscriptionInfolettre =
      await this.utilisateurRepository.recupererDateInscriptionInfolettre(
        utilisateurId,
      );
    const dateVisualisationPopupInfolettre =
      await this.utilisateurRepository.recupererDateVisualisationPopupInfolettre(
        utilisateurId,
      );

    const dateMoinsSixMois = new Date();
    dateMoinsSixMois.setMonth(dateMoinsSixMois.getMonth() - 6);

    if (dateVisualisationVideoAccueil === null) {
      return false;
    }

    return (
      Date.now() - dateVisualisationVideoAccueil.getTime() >
        3 * 24 * 60 * 60 * 1000 &&
      dateInscriptionInfolettre === null &&
      (dateVisualisationPopupInfolettre === null ||
        dateVisualisationPopupInfolettre < dateMoinsSixMois)
    );
  }
}
