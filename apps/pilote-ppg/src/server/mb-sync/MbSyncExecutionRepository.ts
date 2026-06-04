import { type PrismaPilote } from "@/server/db/PrismaPilote";
import { type PilotePrismaClient } from "@/server/db/PrismaTransaction";

export class MbSyncExecutionRepository {
  private readonly prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
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
