import logger from "@/server/infrastructure/Logger";
import {
  type DeleteValeurAvancementItem,
  type MbApiClient,
  type UpsertValeurAvancementItem,
} from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import {
  type EvenementValeurDelta,
  type IndicateurTerritoireValeurEvenementRepository,
} from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type SyncResultat = {
  indicateurs: Array<{ id: string; upserts: number; deletes: number }>;
  lastSyncAt: string;
};

export class SyncMbValeursUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  private readonly mbApiClient: MbApiClient;
  private readonly mbSyncExecutionRepository: MbSyncExecutionRepository;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    mbApiClient,
    mbSyncExecutionRepository,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    mbApiClient: MbApiClient;
    mbSyncExecutionRepository: MbSyncExecutionRepository;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.mbApiClient = mbApiClient;
    this.mbSyncExecutionRepository = mbSyncExecutionRepository;
  }

  async execute(indicateursIds: string[]): Promise<SyncResultat> {
    const lastSyncAt =
      await this.mbSyncExecutionRepository.recupererDerniereDateSync();

    logger.info(
      { source: "cron/sync-mb-valeurs", lastSyncAt },
      "Démarrage de la synchronisation mb-valeurs",
    );

    const resultats: Array<{ id: string; upserts: number; deletes: number }> =
      [];

    for (const indicId of indicateursIds) {
      const evenements =
        await this.indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis(
          { indicId, dateMin: lastSyncAt },
        );

      logger.info(
        { source: "cron/sync-mb-valeurs", indicId, count: evenements.length },
        "Delta récupéré pour l'indicateur",
      );

      if (evenements.length === 0) {
        resultats.push({ id: indicId, upserts: 0, deletes: 0 });
        continue;
      }

      const upserts = this.toUpsertValeurAvancementItems(evenements);
      const deletes = this.toDeleteValeurAvancementItems(evenements);

      const [totalUpserts, totalDeletes] = await Promise.all([
        upserts.length > 0
          ? this.mbApiClient.upsertValeursAvancementBatch({
              indicId,
              items: upserts,
            })
          : Promise.resolve(0),
        deletes.length > 0
          ? this.mbApiClient.deleteValeursAvancement({
              indicId,
              items: deletes,
            })
          : Promise.resolve(0),
      ]);

      resultats.push({
        id: indicId,
        upserts: totalUpserts,
        deletes: totalDeletes,
      });
    }

    const syncAt = new Date();
    await this.mbSyncExecutionRepository.mettreAJourDerniereDateSync(syncAt);

    logger.info(
      { source: "cron/sync-mb-valeurs", resultats },
      "Synchronisation mb-valeurs terminée",
    );

    return { indicateurs: resultats, lastSyncAt: lastSyncAt.toISOString() };
  }

  private toUpsertValeurAvancementItems(
    evenements: EvenementValeurDelta[],
  ): UpsertValeurAvancementItem[] {
    return evenements
      .filter(
        (evenement): evenement is EvenementValeurDelta & { valeur: number } =>
          evenement.valeur !== null,
      )
      .map((evenement) => ({
        individu: evenement.territoire_code,
        date: evenement.dateValeur.toISOString().slice(0, 10),
        valeur: evenement.valeur,
      }));
  }

  private toDeleteValeurAvancementItems(
    evenements: EvenementValeurDelta[],
  ): DeleteValeurAvancementItem[] {
    return evenements
      .filter((evenement) => evenement.valeur === null)
      .map((evenement) => ({
        individu: evenement.territoire_code,
        date: evenement.dateValeur.toISOString().slice(0, 10),
      }));
  }
}
