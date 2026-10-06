import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/referentiels/module";

export class RestoreEngagementHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ engagementId }: { engagementId: string }): Promise<void> {
    await this.prisma.getInstance().metadata_engagement.update({
      where: { engagement_id: engagementId },
      data: { deleted_at: null },
    });
  }
}
