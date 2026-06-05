import { Prisma } from "@prisma/client";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { type PrismaPilote } from "@/server/db/PrismaPilote";
import { type PilotePrismaClient } from "@/server/db/PrismaTransaction";
import logger from "@/server/infrastructure/Logger";
import {
  type MbApiClient,
  type UpsertItem,
} from "@/server/mb-sync/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/MbSyncExecutionRepository";

export const INDICATEURS_A_SYNCHRONISER: string[] = ["IND-003"];

type EvenementDelta = {
  indic_id: string;
  territoire_code: string;
  date_valeur: Date;
  valeur: number | null;
};

export type SyncResultat = {
  indicateurs: Array<{ id: string; total: number }>;
  lastSyncAt: string;
};

export class SyncMbValeursUseCase {
  private readonly prisma: PilotePrismaClient;
  private readonly mbApiClient: MbApiClient;
  private readonly mbSyncExecutionRepository: MbSyncExecutionRepository;

  constructor({
    prisma,
    mbApiClient,
    mbSyncExecutionRepository,
  }: {
    prisma: PrismaPilote;
    mbApiClient: MbApiClient;
    mbSyncExecutionRepository: MbSyncExecutionRepository;
  }) {
    this.prisma = prisma.getInstance();
    this.mbApiClient = mbApiClient;
    this.mbSyncExecutionRepository = mbSyncExecutionRepository;
  }

  async execute(): Promise<SyncResultat> {
    const lastSyncAt =
      await this.mbSyncExecutionRepository.recupererDerniereDateSync();

    logger.info(
      { source: "cron/sync-mb-valeurs", lastSyncAt },
      "Démarrage de la synchronisation mb-valeurs",
    );

    const resultats: Array<{ id: string; total: number }> = [];

    for (const indicId of INDICATEURS_A_SYNCHRONISER) {
      const evenements = await this.recupererEvenementsDelta(
        indicId,
        lastSyncAt,
      );

      logger.info(
        { source: "cron/sync-mb-valeurs", indicId, count: evenements.length },
        "Delta récupéré pour l'indicateur",
      );

      if (evenements.length === 0) {
        resultats.push({ id: indicId, total: 0 });
        continue;
      }

      const items = this.toUpsertItems(evenements);

      const total = await this.mbApiClient.upsertBatch(indicId, items);

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

  private async recupererEvenementsDelta(
    indicId: string,
    lastSyncAt: Date,
  ): Promise<EvenementDelta[]> {
    return this.prisma.$queryRaw<EvenementDelta[]>(
      Prisma.sql`
        SELECT DISTINCT ON (indic_id, territoire_code, date_valeur)
          indic_id, territoire_code, date_valeur, valeur
        FROM indicateur_territoire_valeur_evenement
        WHERE indic_id = ${indicId}
          AND type_evenement::text IN (${Prisma.join([
            EvenementValeurEnum.VALEUR_CREEE,
            EvenementValeurEnum.VALEUR_MODIFIEE,
          ])})
          AND date_modification > ${lastSyncAt}
        ORDER BY indic_id, territoire_code, date_valeur, ordre DESC
      `,
    );
  }

  private toUpsertItems(evenements: EvenementDelta[]): UpsertItem[] {
    return evenements
      .filter(
        (evenement): evenement is EvenementDelta & { valeur: number } =>
          evenement.valeur !== null,
      )
      .map((evenement) => ({
        individu: evenement.territoire_code,
        date: evenement.date_valeur.toISOString().slice(0, 10),
        valeur: evenement.valeur,
      }));
  }
}
