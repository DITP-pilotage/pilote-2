import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { getContainer } from "@/server/dependances";
import { validationModifierMonProfil } from "@/validation/mon-profil";
import { zodValidateurCSRF } from "@/validation/publication";

export const profilUtilisateurRouter = créerRouteurTRPC({
  getUtilisateurConnecte: procédureProtégée.query(async ({ ctx }) => {
    const session = ctx.session;
    if (session == null) {
      throw new UnauthorizedError("Utilisateur non authentifié");
    }

    const query = getContainer("profilUtilisateur").resolve(
      "getProfilUtilisateurQuery",
    );
    return query.run(session.user.id);
  }),
  modifierMonProfil: procédureProtégée
    .input(validationModifierMonProfil.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      await getContainer("profilUtilisateur")
        .resolve("modifierMonProfilUseCase")
        .run(ctx.session.user.id, input);
    }),
});
