import { type PrismaPilote } from "@/server/db/PrismaPilote";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";

export class PrismaMbSyncExecutionRepository implements MbSyncExecutionRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async recupererDerniereDateSync(): Promise<Date> {
    const execution = await this.prisma.mb_sync_execution.findFirst();
    return execution?.derniere_date_sync ?? new Date(0);
  }

  async mettreAJourDerniereDateSync(date: Date): Promise<void> {
    const execution = await this.prisma.mb_sync_execution.findFirst();
    if (execution) {
      await this.prisma.mb_sync_execution.update({
        where: { id: execution.id },
        data: { derniere_date_sync: date },
      });
    } else {
      await this.prisma.mb_sync_execution.create({
        data: { derniere_date_sync: date },
      });
    }
  }
}
