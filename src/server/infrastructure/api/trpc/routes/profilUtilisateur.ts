import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { dependencies } from "@/server/infrastructure/Dependencies";

export const profilUtilisateurRouter = créerRouteurTRPC({
  getUtilisateurConnecte: procédureProtégée.query(async ({ ctx }) => {
    const session = ctx.session;
    if (session == null) {
      throw new UnauthorizedError("Utilisateur non authentifié");
    }

    const utilisateur = await dependencies
      .getUtilisateurRepository()
      .récupérer(session.user.email);

    if (utilisateur == null) {
      throw new UnauthorizedError("Utilisateur non authentifié");
    }

    return {
      id: utilisateur.id,
      prenom: utilisateur.prénom,
      nom: utilisateur.nom,
      email: utilisateur.email,
      fonction: utilisateur.fonction,
    };
  }),
});
