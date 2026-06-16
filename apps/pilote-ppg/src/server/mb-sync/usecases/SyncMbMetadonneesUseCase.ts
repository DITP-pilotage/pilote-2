import { $Enums } from "@prisma/client";
import logger from "@/server/infrastructure/Logger";
import {
  type MbApiClient,
  type UpsertIndicateurPayload,
} from "@/server/mb-sync/domain/ports/MbApiClient";
import { type IndicateurIdentiteRepository } from "@/server/mb-sync/domain/ports/IndicateurIdentiteRepository";

const MAILLE_VERS_REFERENTIEL: Record<$Enums.Maille, string> = {
  NAT: "REF-NAT",
  REG: "REF-REG",
  DEPT: "REF-DEPT",
};

function mapUniteMesure(
  uniteMesure: string | null,
): UpsertIndicateurPayload["unite"] {
  if (!uniteMesure) return null;
  const normalized = uniteMesure.trim().toLowerCase();
  if (normalized === "%" || normalized === "pourcentage") return "POURCENTAGE";
  if (
    normalized === "ans" ||
    normalized === "années" ||
    normalized === "annees"
  )
    return "ANNEES";
  return null;
}

export type SyncMetadonneesResultat = {
  indicateurs: Array<{ id: string; statut: "ok" | "non_trouve" }>;
};

export class SyncMbMetadonneesUseCase {
  private readonly indicateurIdentiteRepository: IndicateurIdentiteRepository;
  private readonly mbApiClient: MbApiClient;

  constructor({
    indicateurIdentiteRepository,
    mbApiClient,
  }: {
    indicateurIdentiteRepository: IndicateurIdentiteRepository;
    mbApiClient: MbApiClient;
  }) {
    this.indicateurIdentiteRepository = indicateurIdentiteRepository;
    this.mbApiClient = mbApiClient;
  }

  async execute(indicateursIds: string[]): Promise<SyncMetadonneesResultat> {
    logger.info(
      { source: "cron/sync-mb-valeurs" },
      "Démarrage de la synchronisation mb-metadonnees",
    );

    const resultats: SyncMetadonneesResultat["indicateurs"] = [];

    for (const indicId of indicateursIds) {
      const indicateur =
        await this.indicateurIdentiteRepository.findById(indicId);

      if (!indicateur) {
        logger.warn(
          { source: "cron/sync-mb-valeurs", indicId },
          "Indicateur absent de indicateur_identite, sync métadonnées ignorée",
        );
        resultats.push({ id: indicId, statut: "non_trouve" });
        continue;
      }

      const referentiels = indicateur.maillesApplicables.map((maille) => ({
        id: MAILLE_VERS_REFERENTIEL[maille],
        fonctionAgregation: "NONE" as const,
      }));

      await this.mbApiClient.upsertIndicateur({
        indicId,
        payload: {
          nom: indicateur.nom,
          visibilite: "PUBLIC",
          unite: mapUniteMesure(indicateur.uniteMesure),
          referentiels,
        },
      });

      logger.info(
        { source: "cron/sync-mb-valeurs", indicId },
        "Métadonnées synchronisées",
      );

      resultats.push({ id: indicId, statut: "ok" });
    }

    logger.info(
      { source: "cron/sync-mb-valeurs", resultats },
      "Synchronisation mb-metadonnees terminée",
    );

    return { indicateurs: resultats };
  }
}
