import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/analytics/module";
import {
  ANALYTICS_DIMENSIONS,
  dimensionSlotSchema,
} from "@/shared/analytics/dimensions";
import { ConflictError } from "@/shared/errors/conflict-error";

export const setDimensionSlotCommandSchema = z.object({
  dimension: z.enum(ANALYTICS_DIMENSIONS),
  slot: dimensionSlotSchema.nullable(),
});

export type SetDimensionSlotCommand = z.infer<
  typeof setDimensionSlotCommandSchema
>;

export class SetDimensionSlotHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({ dimension, slot }: SetDimensionSlotCommand): Promise<void> {
    const client = this.prisma.getInstance();

    if (slot === null) {
      await client.analytics_dimension.deleteMany({
        where: { cle: dimension },
      });
      return;
    }

    const taken = await client.analytics_dimension.findFirst({
      where: {
        slot,
        cle: {
          in: ANALYTICS_DIMENSIONS.filter((other) => other !== dimension),
        },
      },
      select: { cle: true },
    });
    if (taken) {
      throw new ConflictError(
        `Le numéro ${slot} est déjà utilisé par « ${taken.cle} ».`,
      );
    }

    // Une dimension retirée du code n'apparaît plus dans le panel : elle ne doit pas garder son numéro.
    await client.analytics_dimension.deleteMany({
      where: { slot, cle: { notIn: [...ANALYTICS_DIMENSIONS] } },
    });

    try {
      await client.analytics_dimension.upsert({
        where: { cle: dimension },
        update: { slot },
        create: { cle: dimension, slot },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          `Le numéro ${slot} vient d'être pris par une autre dimension.`,
        );
      }
      throw error;
    }
  }
}
