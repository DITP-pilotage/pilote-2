import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/analytics/module";
import {
  ANALYTICS_DIMENSIONS,
  type DimensionSlots,
} from "@/shared/analytics/dimensions";

export class GetDimensionSlotsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<DimensionSlots> {
    const dimensions = await this.prisma
      .getInstance()
      .analytics_dimension.findMany({ select: { cle: true, slot: true } });
    const slotByCle = new Map(dimensions.map(({ cle, slot }) => [cle, slot]));

    const slots: DimensionSlots = {};
    for (const dimension of ANALYTICS_DIMENSIONS) {
      const slot = slotByCle.get(dimension);
      if (slot !== undefined) slots[dimension] = slot;
    }
    return slots;
  }
}
