import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  CHANTIER_DETAILS_BATCH_SIZE,
  fetchChantierDetailsBatch,
} from "@/server/rapport-detaille/fetchChantierDetailsBatch";

export const rapportDetailleRouter = créerRouteurTRPC({
  chantierDetails: procédureProtégée
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
