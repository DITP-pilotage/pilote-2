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
  recupererValeursAvancementTerritoires: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const result = await getContainer("chantiers")
        .resolve("listerDetailsIndicateurTerritoireUseCaseV2")
        .run(
          [input.indicateurId],
          input.chantierId,
          ctx.session.habilitations,
          ctx.session.profil,
          input.jalon,
        );

      const details = result[input.indicateurId] ?? {};

      return Object.entries(details).map(([codeInsee, detail]) => ({
        territoireCode: codeInsee,
        valeurAvancement: detail.valeurAvancement,
        valeurCibleAnnuelle: detail.valeurCibleAnnuelle,
        estApplicable: detail.estApplicable,
      }));
    }),
});
