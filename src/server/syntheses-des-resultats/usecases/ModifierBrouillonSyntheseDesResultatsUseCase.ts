import { Météo } from "@/server/domain/météo/Météo.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { modifierSyntheseDesResultatsBrouillon } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class ModifierBrouillonSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
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
    meteo: Météo;
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
