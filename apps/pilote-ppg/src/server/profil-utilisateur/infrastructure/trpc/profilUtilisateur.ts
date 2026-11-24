import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";
import { getContainer } from "@/server/dependances";
import { validationModifierMonProfil } from "@/validation/mon-profil";

export const profilUtilisateurRouter = createTRPCRouter({
  getUtilisateurConnecte: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    if (session == null) {
      throw new UnauthorizedError("Utilisateur non authentifié");
    }

    const query = getContainer("profilUtilisateur").resolve(
      "getProfilUtilisateurQuery",
    );
    return query.run(session.user.id);
  }),
  modifierMonProfil: protectedProcedure
    .input(validationModifierMonProfil)
    .mutation(async ({ input, ctx }) => {
      await getContainer("profilUtilisateur")
        .resolve("modifierMonProfilUseCase")
        .run(ctx.session.user.id, input);
    }),
});
