import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { fetchChantierDetailsBatch } from "@/server/rapport-detaille/fetchChantierDetailsBatch";
import { CHANTIER_DETAILS_BATCH_SIZE } from "@/server/rapport-detaille/batchSize";

export const rapportDetailleRouter = createTRPCRouter({
  chantierDetails: protectedProcedure
    .input(
      z.object({
        territoireCode: z.string(),
        query: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        chantierIds: z
          .array(z.string())
          .min(1)
          .max(CHANTIER_DETAILS_BATCH_SIZE),
      }),
    )
    .query(({ ctx, input }) => fetchChantierDetailsBatch(input, ctx.session)),
});
