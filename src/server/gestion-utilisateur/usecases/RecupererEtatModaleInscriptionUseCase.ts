import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository
};

export class RecupererEtatModaleInscriptionUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({
    utilisateurRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string): Promise<boolean> {
    const videoAccueilEstDejaVisualisee = await this.utilisateurRepository.recupererEtatVisualisationVideoAccueil(utilisateurId);
    const dateInscriptionInfolettre = await this.utilisateurRepository.recupererDateInscriptionInfolettre(utilisateurId);
    const dateVisualisationPopupInfolettre = await this.utilisateurRepository.recupererDateVisualisationPopupInfolettre(utilisateurId);

    const dateMoinsSixMois = new Date();
    dateMoinsSixMois.setMonth(dateMoinsSixMois.getMonth() - 6);
    
    return videoAccueilEstDejaVisualisee 
      && dateInscriptionInfolettre === null 
      && (dateVisualisationPopupInfolettre === null || dateVisualisationPopupInfolettre < dateMoinsSixMois);
  } 
}
