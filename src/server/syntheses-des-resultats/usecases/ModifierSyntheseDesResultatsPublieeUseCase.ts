import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { modifierSyntheseDesResultats } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class ModifierSyntheseDesResultatsPublieeUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
    },
  ) {}

  async execute({
    syntheseAModifier,
    contenu,
    meteo,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    syntheseAModifier: SynthèseDesRésultatsV2;
    contenu: string;
    meteo: Météo;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      syntheseAModifier.chantierId,
      syntheseAModifier.territoireCode,
    );

    const synthese = modifierSyntheseDesResultats(syntheseAModifier, {
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
