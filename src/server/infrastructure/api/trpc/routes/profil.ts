import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import RécupérerUnProfilUseCase from "@/server/usecase/profil/RécupérerUnProfilUseCase";
import { validationProfilContexte } from "@/validation/profil";
import { getContainer } from "@/server/dependances";

export const profilRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée.query(() => {
    return getContainer("gestionUtilisateur")
      .resolve("recupererListeProfilUseCase")
      .run();
  }),

  récupérer: procédureProtégée
    .input(validationProfilContexte)
    .query(({ input }) => {
      return new RécupérerUnProfilUseCase(
        getContainer("legacy").resolve("profilRepository"),
      ).run(input.profilCode);
    }),
});
