import { PilotePrismaClient } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { toISODateTime } from "@/server/app/domain/Dates";

export type DatajobsExecution = {
  derniereDateExecution: string;
};

export class DatajobsExecutionQueries {
  private readonly prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async recupererEtatCourant(): Promise<DatajobsExecution> {
    const datajobsExecution = await this.prisma.datajobs_execution.findFirst();

    if (!datajobsExecution) {
      const date = new Date();
      date.setHours(date.getHours() - 1);

      return {
        derniereDateExecution: toISODateTime(date),
      };
    }

    return {
      derniereDateExecution: toISODateTime(
        datajobsExecution.derniere_date_execution,
      ),
    };
  }
}
