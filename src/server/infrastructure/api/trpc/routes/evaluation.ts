import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";

const validationEnregistrerBrouillonSchema = z.object({
  evaluationsSousCriteres: z
    .object({
      id: z.string(),
      sousCritereId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
    })
    .array(),
  evaluationsObjectifs: z
    .object({
      id: z.string(),
      objectifId: z.string(),
      note: z.number().int().nullable(),
      commentaire: z.string(),
    })
    .array(),
});

export const evaluationRouter = créerRouteurTRPC({
  enregistrerBrouillon: procédureProtégée
    .input(validationEnregistrerBrouillonSchema)
    .mutation(async ({ input, ctx }) => {
      console.log(input);
    }),
});
