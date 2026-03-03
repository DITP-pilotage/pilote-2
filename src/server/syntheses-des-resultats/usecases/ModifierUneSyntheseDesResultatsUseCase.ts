import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

export class ModifierUneSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
      chantierRepository: ChantierRepository;
    },
  ) {}

  async execute({
    syntheseAModifier,
    contenu,
    météo,
    auteur_modification_id,
    date_modification,
    habilitations,
  }: {
    syntheseAModifier: SynthèseDesRésultatsV2;
    contenu: string;
    météo: Météo;
    auteur_modification_id: string;
    date_modification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(
      syntheseAModifier.chantierId,
      syntheseAModifier.territoireCode,
    );

    await Promise.all([
      this.dependencies.chantierRepository.modifierMétéo(
        syntheseAModifier.chantierId,
        syntheseAModifier.territoireCode,
        météo,
      ),
      this.dependencies.synthèseDesRésultatsRepository.save({
        ...syntheseAModifier,
        contenu,
        météo,
        auteur_modification_id,
        date_modification,
      }),
    ]);
  }
}
