import { MessageInformation } from '@/server/gestion-contenu/domain/MessageInformation';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';

interface Dependencies {
  gestionContenuRepository: GestionContenuRepository
}

export class RécupérerMessageInformationUseCase {
  private _gestionContenuRepository: GestionContenuRepository;

  constructor({ gestionContenuRepository }: Dependencies) {
    this._gestionContenuRepository = gestionContenuRepository;
  }

  async run(): Promise<MessageInformation> {
    const listeVariableContenu = await this._gestionContenuRepository.recupererMapVariableContenuParListeDeNom(['NEXT_BD_FF_BANDEAU_INDISPONIBILITE', 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE', 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE']);
    return MessageInformation.creerMessageInformation({
      bandeauTexte: listeVariableContenu.NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE!, // trouver un meilleur type pour enlever les !!!
      isBandeauActif: listeVariableContenu.NEXT_BD_FF_BANDEAU_INDISPONIBILITE!,
      bandeauType: listeVariableContenu.NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE!,
    });
  }
}
