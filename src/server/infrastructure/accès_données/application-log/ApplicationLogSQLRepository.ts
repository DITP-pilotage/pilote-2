import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository";

export class ApplicationLogSQLRepository implements ApplicationLogRepository {
  private readonly prisma;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async purger(anterieurA: Date): Promise<number> {
    const result = await this.prisma.application_log.deleteMany({
      where: { timestamp: { lt: anterieurA } },
    });
    return result.count;
  }
}
