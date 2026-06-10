import logger from "@/server/infrastructure/Logger";
import {
  type DeleteObjectifIndicateurItem,
  type MbApiClient,
  type UpsertObjectifIndicateurItem,
} from "@/server/mb-sync/domain/ports/MbApiClient";
import {
  type MesureIndicateurObjectifRepository,
  type ObjectifMesure,
} from "@/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository";

export type SyncObjectifsResultat = {
  indicateurs: Array<{ id: string; upserts: number; deletes: number }>;
};

export class SyncMbObjectifsUseCase {
  private readonly mesureIndicateurObjectifRepository: MesureIndicateurObjectifRepository;
  private readonly mbApiClient: MbApiClient;

  constructor({
    mesureIndicateurObjectifRepository,
    mbApiClient,
  }: {
    mesureIndicateurObjectifRepository: MesureIndicateurObjectifRepository;
    mbApiClient: MbApiClient;
  }) {
    this.mesureIndicateurObjectifRepository =
      mesureIndicateurObjectifRepository;
    this.mbApiClient = mbApiClient;
  }

  async execute(indicateursIds: string[]): Promise<SyncObjectifsResultat> {
    logger.info(
      { source: "cron/sync-mb-valeurs" },
      "Démarrage de la synchronisation mb-objectifs",
    );

    const resultats: Array<{ id: string; upserts: number; deletes: number }> =
      [];

    for (const indicId of indicateursIds) {
      const mesures =
        await this.mesureIndicateurObjectifRepository.recupererDernieresValeursCibles(
          { indicId },
        );

      logger.info(
        { source: "cron/sync-mb-valeurs", indicId, count: mesures.length },
        "Valeurs cibles récupérées pour l'indicateur",
      );

      if (mesures.length === 0) {
        resultats.push({ id: indicId, upserts: 0, deletes: 0 });
        continue;
      }

      const upserts = this.toUpsertItems(mesures);
      const deletes = this.toDeleteItems(mesures);

      const [totalUpserts, totalDeletes] = await Promise.all([
        upserts.length > 0
          ? this.mbApiClient.upsertObjectifsIndicateurBatch({
              indicId,
              items: upserts,
            })
          : Promise.resolve(0),
        this.executeDeletes(indicId, deletes),
      ]);

      resultats.push({
        id: indicId,
        upserts: totalUpserts,
        deletes: totalDeletes,
      });
    }

    logger.info(
      { source: "cron/sync-mb-valeurs", resultats },
      "Synchronisation mb-objectifs terminée",
    );

    return { indicateurs: resultats };
  }

  private toUpsertItems(
    mesures: ObjectifMesure[],
  ): UpsertObjectifIndicateurItem[] {
    return mesures
      .filter((mesure): mesure is ObjectifMesure & { metric_value: number } => {
        if (mesure.metric_value === null) return false;
        if (isNaN(mesure.metric_value)) {
          logger.warn(
            {
              source: "cron/sync-mb-valeurs",
              territoire_code: mesure.territoire_code,
              metric_date: mesure.metric_date,
            },
            "Valeur cible non numérique ignorée",
          );
          return false;
        }
        return true;
      })
      .map((mesure) => ({
        individu: mesure.territoire_code,
        dateCible: mesure.metric_date,
        valeurCible: mesure.metric_value,
      }));
  }

  private toDeleteItems(
    mesures: ObjectifMesure[],
  ): DeleteObjectifIndicateurItem[] {
    return mesures
      .filter((mesure) => mesure.metric_value === null)
      .map((mesure) => ({
        individu: mesure.territoire_code,
        dateCible: mesure.metric_date,
      }));
  }

  private async executeDeletes(
    indicId: string,
    items: DeleteObjectifIndicateurItem[],
  ): Promise<number> {
    for (const item of items) {
      await this.mbApiClient.deleteObjectifIndicateur({ indicId, item });
    }
    return items.length;
  }
}
