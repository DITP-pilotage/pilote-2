import { SyntheseDesResultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { modifierSyntheseDesResultats } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class PublierBrouillonSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
    },
  ) {}

  async execute({
    brouillon,
    contenu,
    meteo,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    brouillon: SyntheseDesResultatsV2;
    contenu: string;
    meteo: Météo;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      brouillon.territoireCode,
    );

    const synthese = modifierSyntheseDesResultats(brouillon, {
      contenu,
      meteo,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.enregistrerSyntheseDesResultatsService.enregistrer(
      synthese,
    );
  }
}
