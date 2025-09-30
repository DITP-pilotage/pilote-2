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
});
