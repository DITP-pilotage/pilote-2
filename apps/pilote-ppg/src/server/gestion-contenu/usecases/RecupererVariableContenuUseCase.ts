import {
  VariableContenuDisponibleEnv,
  FEATURE_FLIP_KEYS,
  FEATURE_FLIP_CONFIG_KEY_MAP,
  FeatureFlipKey,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { configuration } from "@/config";

export class RecupererVariableContenuUseCase {
  run<T extends keyof VariableContenuDisponibleEnv>({
    nomVariableContenu,
  }: {
    nomVariableContenu: T;
  }): VariableContenuDisponibleEnv[T] | undefined {
    // Variables non-FF avec accès config spécifique
    switch (nomVariableContenu) {
      case "NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION": {
        return configuration().featureFlip
          .limiteCaracteresPublication as VariableContenuDisponibleEnv[T];
      }
      case "NEXT_PUBLIC_SCHEMA_VALIDATA_URL": {
        return configuration()
          .schemaValidataUrl as VariableContenuDisponibleEnv[T];
      }
      case "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE": {
        return configuration()
          .dateBasculeAffichageValeursAnneePrecedente as VariableContenuDisponibleEnv[T];
      }
    }

    // Feature flips — lecture via le mapping centralisé
    if (
      FEATURE_FLIP_KEYS.includes(
        nomVariableContenu as unknown as FeatureFlipKey,
      )
    ) {
      const configKey =
        FEATURE_FLIP_CONFIG_KEY_MAP[nomVariableContenu as FeatureFlipKey];
      return configuration().featureFlip[
        configKey
      ] as VariableContenuDisponibleEnv[T];
    }
  }
}
