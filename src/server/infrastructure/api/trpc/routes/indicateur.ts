import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { validationDétailsIndicateur } from "@/validation/indicateur";
import RécupérerDétailsIndicateurUseCase from "@/server/usecase/chantier/indicateur/RécupérerDétailsIndicateurUseCase";

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
});
