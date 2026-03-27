import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import {
  FEATURE_FLIP_KEYS,
  FEATURE_FLIP_CONFIG_KEY_MAP,
  FeatureFlipMap,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { configuration, configurationFeatureFlip } from "@/config";
import type { Inject } from "@/server/legacy/module";

export class RecupererFeatureFlipsUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({
    gestionContenuRepository,
  }: Inject<"gestionContenuRepository">) {
    this.gestionContenuRepository = gestionContenuRepository;
  }

  async run(): Promise<FeatureFlipMap> {
    const featureFlipConfig = configurationFeatureFlip();

    // Construire les valeurs depuis la config (env vars)
    const result = {} as FeatureFlipMap;
    for (const key of FEATURE_FLIP_KEYS) {
      const configKey = FEATURE_FLIP_CONFIG_KEY_MAP[key];
      result[key] = Boolean(featureFlipConfig[configKey]);
    }

    // Si le FF admin est désactivé, on retourne uniquement les valeurs config
    if (!configuration().featureFlip.featureFlipAdmin) {
      return result;
    }

    // Récupérer les overrides stockés en DB
    const dbValues =
      await this.gestionContenuRepository.recupererMapVariableContenuParListeDeNom(
        [...FEATURE_FLIP_KEYS],
      );

    // Fusionner : DB > config
    for (const key of FEATURE_FLIP_KEYS) {
      const dbValue = dbValues[key];
      if (dbValue !== undefined) {
        result[key] = dbValue as boolean;
      }
    }

    return result;
  }
}
