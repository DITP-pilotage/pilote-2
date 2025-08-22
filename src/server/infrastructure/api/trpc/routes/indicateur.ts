import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { dependencies } from "@/server/infrastructure/Dependencies";
import {
  validationDétailsIndicateur,
  validationHistoriqueIndicateurTerritoire,
} from "@/validation/indicateur";
import RécupérerDétailsIndicateurUseCase from "@/server/usecase/chantier/indicateur/RécupérerDétailsIndicateurUseCase";
import { getContainer } from "@/server/dependances";

export const indicateurRouter = créerRouteurTRPC({
  récupererDétailsIndicateur: procédureProtégée
    .input(validationDétailsIndicateur)
    .query(async ({ input, ctx }) => {
      const récupérerDétailIndicateurUseCase =
        new RécupérerDétailsIndicateurUseCase(
          dependencies.getIndicateurRepository(),
        );
      return récupérerDétailIndicateurUseCase.run(
        input.indicateurId,
        ctx.session.habilitations,
        ctx.session.profil,
        input.jalon,
      );
    }),

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
