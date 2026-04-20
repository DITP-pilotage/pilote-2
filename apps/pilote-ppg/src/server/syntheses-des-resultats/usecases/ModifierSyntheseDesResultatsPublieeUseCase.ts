import { Meteo } from "@/server/domain/météo/Météo.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { modifierSyntheseDesResultatsPubliee } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class ModifierSyntheseDesResultatsPublieeUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
    },
  ) {}

  async execute({
    syntheseId,
    contenu,
    meteo,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    syntheseId: string;
    contenu: string;
    meteo: Meteo;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const syntheseAModifier =
      await this.dependencies.synthèseDesRésultatsRepository.getById(
        syntheseId,
      );

    if (!syntheseAModifier)
      throw new Error(`Synthèse introuvable : ${syntheseId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      syntheseAModifier.chantierId,
      syntheseAModifier.territoireCode,
    );

    const synthese = modifierSyntheseDesResultatsPubliee(syntheseAModifier, {
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
