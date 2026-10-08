import { Meteo } from "@/shared/meteo/Meteo.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { SyntheseDesResultatsRepository } from "@/server/syntheses-des-resultats/infrastructure/sql/SyntheseDesResultatsRepository.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { modifierSyntheseDesResultatsBrouillon } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class ModifierBrouillonSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
      synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;
    },
  ) {}

  async execute({
    brouillonId,
    contenu,
    meteo,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    brouillonId: string;
    contenu: string;
    meteo: Meteo;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const brouillon =
      await this.dependencies.synthèseDesRésultatsRepository.getById(
        brouillonId,
      );

    if (!brouillon) throw new Error(`Brouillon introuvable : ${brouillonId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      brouillon.territoireCode,
    );

    const synthese = modifierSyntheseDesResultatsBrouillon(brouillon, {
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
