import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { validationProfilContexte } from "@/validation/profil";
import { getContainer } from "@/server/dependances";

export const profilRouter = createTRPCRouter({
  list: protectedProcedure.query(() => {
    return getContainer("gestionUtilisateur")
      .resolve("recupererListeProfilUseCase")
      .run();
  }),

  get: protectedProcedure.input(validationProfilContexte).query(({ input }) => {
    return getContainer("gestionUtilisateur")
      .resolve("récupérerUnProfilUseCase")
      .run(input.profilCode);
  }),
});
