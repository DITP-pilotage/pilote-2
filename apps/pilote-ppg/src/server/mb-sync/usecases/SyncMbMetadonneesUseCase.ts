import { $Enums } from "@prisma/client";
import { type PrismaPilote } from "@/server/db/PrismaPilote";
import { type PilotePrismaClient } from "@/server/db/PrismaTransaction";
import logger from "@/server/infrastructure/Logger";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";

const MAILLE_VERS_REFERENTIEL: Record<$Enums.Maille, string> = {
  NAT: "REF-NAT",
  REG: "REF-REG",
  DEPT: "REF-DEPT",
};

export type SyncMetadonneesResultat = {
  indicateurs: Array<{ id: string; statut: "ok" | "non_trouve" }>;
};

export class SyncMbMetadonneesUseCase {
  private readonly prisma: PilotePrismaClient;
  private readonly mbApiClient: MbApiClient;

  constructor({
    prisma,
    mbApiClient,
  }: {
    prisma: PrismaPilote;
    mbApiClient: MbApiClient;
  }) {
    this.prisma = prisma.getInstance();
    this.mbApiClient = mbApiClient;
  }

  async execute(indicateursIds: string[]): Promise<SyncMetadonneesResultat> {
    logger.info(
      { source: "cron/sync-mb-valeurs" },
      "Démarrage de la synchronisation mb-metadonnees",
    );

    const resultats: SyncMetadonneesResultat["indicateurs"] = [];

    for (const indicId of indicateursIds) {
      const indicateur = await this.prisma.indicateur_identite.findUnique({
        where: { id: indicId },
      });

      if (!indicateur) {
        logger.warn(
          { source: "cron/sync-mb-valeurs", indicId },
          "Indicateur absent de indicateur_identite, sync métadonnées ignorée",
        );
        resultats.push({ id: indicId, statut: "non_trouve" });
        continue;
      }

      const referentiels = indicateur.mailles_applicables.map((maille) => ({
        referentielPublicId: MAILLE_VERS_REFERENTIEL[maille],
        fonctionAgregation: "NONE" as const,
      }));

      await this.mbApiClient.upsertIndicateur(indicId, {
        nom: indicateur.nom,
        visibilite: "PRIVE",
        referentiels,
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
