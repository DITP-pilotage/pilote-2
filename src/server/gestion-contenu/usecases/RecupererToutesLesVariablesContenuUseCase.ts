import {
  VARIABLE_CONTENU_DISPONIBLE_ENV,
  VariableContenuDisponibleEnv,
  FEATURE_FLIP_KEYS,
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

    // Restreindre aux flips effectivement disponibles dans l'env/config
    const featureFlipKeysInEnv = FEATURE_FLIP_KEYS.filter(
      (key) => key in configValues,
    );

    // Récupérer les overrides DB pour les feature flips
    const dbValues =
      await this.gestionContenuRepository.recupererMapVariableContenuParListeDeNom(
        [...featureFlipKeysInEnv],
      );

    // Fusionner : DB > config
    const mergedValues: Record<string, unknown> = { ...configValues };
    for (const key of featureFlipKeysInEnv) {
      const dbValue = dbValues[key];
      if (dbValue !== undefined) {
        mergedValues[key] = dbValue as boolean;
      }
    }

    return mergedValues as VariableContenuDisponibleEnv;
  }
}
