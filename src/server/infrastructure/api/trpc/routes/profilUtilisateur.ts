import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { getContainer } from "@/server/dependances";

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
});
