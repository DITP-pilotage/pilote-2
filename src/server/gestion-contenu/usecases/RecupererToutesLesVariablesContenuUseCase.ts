import {
  VARIABLE_CONTENU_DISPONIBLE_ENV,
  VariableContenuDisponibleEnv,
  FEATURE_FLIP_KEYS,
  FeatureFlipKey,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { RecupererVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererVariableContenuUseCase";
import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import { configuration } from "@/config";
import type { Inject } from "@/server/legacy/module";

export class RecupererToutesLesVariablesContenuUseCase {
  private gestionContenuRepository: GestionContenuRepository;

  constructor({
    gestionContenuRepository,
  }: Inject<"gestionContenuRepository">) {
    this.gestionContenuRepository = gestionContenuRepository;
  }

  async run(): Promise<VariableContenuDisponibleEnv> {
    const recupererVariableContenuUseCase =
      new RecupererVariableContenuUseCase();

    // Valeurs par défaut depuis la config (env vars)
    const configValues = Object.fromEntries(
      VARIABLE_CONTENU_DISPONIBLE_ENV.map((nomVariable) => [
        nomVariable,
        recupererVariableContenuUseCase.run({
          nomVariableContenu: nomVariable,
        }),
      ]),
    ) as VariableContenuDisponibleEnv;

    // Feature flip : si désactivé, on retourne directement les valeurs config (ancien comportement)
    if (!configuration().featureFlip.featureFlipAdmin) {
      return configValues;
    }

    // Récupérer les overrides DB pour les feature flips
    const dbValues =
      await this.gestionContenuRepository.recupererMapVariableContenuParListeDeNom(
        [...FEATURE_FLIP_KEYS],
      );

    // Fusionner : DB > config
    for (const key of FEATURE_FLIP_KEYS) {
      const dbValue = dbValues[key];
      if (dbValue !== undefined) {
        const envKey = key as FeatureFlipKey &
          keyof VariableContenuDisponibleEnv;
        if (envKey in configValues) {
          (configValues as Record<string, unknown>)[envKey] =
            dbValue as boolean;
        }
      }
    }

    return configValues;
  }
}
