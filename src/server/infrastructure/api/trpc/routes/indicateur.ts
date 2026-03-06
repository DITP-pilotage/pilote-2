import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { validationHistoriqueIndicateurTerritoire } from "@/validation/indicateur";
import { getContainer } from "@/server/dependances";

export const indicateurRouter = créerRouteurTRPC({
  recupererHistoriqueIndicateurTerritoire: procédureProtégée
    .input(validationHistoriqueIndicateurTerritoire)
    .query(async ({ input }) => {
      return getContainer("indicateurTerritoireValeurEvenement")
        .resolve(
          "recupererHistoriqueIndicateurTerritoireValeurEvenementUseCase",
        )
        .run({
          indicId: input.indicateurId,
          territoireCode: input.territoireCode,
        });
    }),
  publierFichierImporte: procédureProtégée
    .input(z.object({ rapportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getContainer("importIndicateur")
        .resolve("publierFichierIndicateurImporteUseCase")
        .execute({
          rapportId: input.rapportId,
          auteurId: ctx.session.user.id,
        });
    }),
});
