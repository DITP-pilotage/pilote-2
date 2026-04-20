import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import type { Inject } from "@/server/legacy/module";

export class ModifierMessageInformationUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({
    gestionContenuRepository,
  }: Inject<"gestionContenuRepository">) {
    this.gestionContenuRepository = gestionContenuRepository;
  }

  async run({
    bandeauTexte,
    isBandeauActif,
    bandeauType,
  }: {
    bandeauTexte: string;
    isBandeauActif: boolean;
    bandeauType: string;
  }) {
    await this.gestionContenuRepository.mettreAJourContenu(
      "NEXT_BD_FF_BANDEAU_INDISPONIBILITE",
      isBandeauActif,
    );
    await this.gestionContenuRepository.mettreAJourContenu(
      "NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE",
      bandeauTexte,
    );
    await this.gestionContenuRepository.mettreAJourContenu(
      "NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE",
      bandeauType,
    );
  }
}
