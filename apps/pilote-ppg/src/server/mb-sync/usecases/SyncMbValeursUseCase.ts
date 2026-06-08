import logger from "@/server/infrastructure/Logger";
import {
  type MbApiClient,
  type UpsertValeurAvancementItem,
} from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import {
  type EvenementValeurDelta,
  type IndicateurTerritoireValeurEvenementRepository,
} from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type SyncResultat = {
  indicateurs: Array<{ id: string; total: number }>;
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

    const resultats: Array<{ id: string; total: number }> = [];

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
        resultats.push({ id: indicId, total: 0 });
        continue;
      }

      const items = this.toUpsertValeurAvancementItems(evenements);

      const total = await this.mbApiClient.upsertValeursAvancementBatch({
        indicId,
        items,
      });

      resultats.push({ id: indicId, total });
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
}
