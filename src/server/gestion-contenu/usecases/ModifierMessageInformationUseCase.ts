import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';

interface Dependencies {
  gestionContenuRepository: GestionContenuRepository
}
export class ModifierMessageInformationUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({ gestionContenuRepository }: Dependencies) {
    this.gestionContenuRepository = gestionContenuRepository;

  }

  async run({ bandeauTexte, isBandeauActif, bandeauType }: {
    bandeauTexte: string;
    isBandeauActif: boolean;
    bandeauType: string
  }) {
    await this.gestionContenuRepository.mettreAJourContenu('NEXT_BD_FF_BANDEAU_INDISPONIBILITE', isBandeauActif);
    await this.gestionContenuRepository.mettreAJourContenu('NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE', bandeauTexte);
    await this.gestionContenuRepository.mettreAJourContenu('NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE', bandeauType);
  }
}
