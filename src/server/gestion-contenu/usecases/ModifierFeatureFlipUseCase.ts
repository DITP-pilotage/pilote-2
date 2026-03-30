import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import {
  FeatureFlipKey,
  FEATURE_FLIP_KEYS,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import type { Inject } from "@/server/legacy/module";

export class ModifierFeatureFlipUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({
    gestionContenuRepository,
  }: Inject<"gestionContenuRepository">) {
    this.gestionContenuRepository = gestionContenuRepository;
  }

  async run({
    featureFlips,
  }: {
    featureFlips: Partial<Record<FeatureFlipKey, boolean>>;
  }) {
    const updates = Object.entries(featureFlips).filter(([key]) =>
      FEATURE_FLIP_KEYS.includes(key as FeatureFlipKey),
    ) as [FeatureFlipKey, boolean][];

    await Promise.all(
      updates.map(([key, value]) =>
        this.gestionContenuRepository.mettreAJourContenu(key, value),
      ),
    );
  }
}
