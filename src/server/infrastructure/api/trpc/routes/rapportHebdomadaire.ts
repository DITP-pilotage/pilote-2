import { z } from "zod";

import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const rapportHebdomadaireRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    const { session } = ctx;

    if (
      session.profil !== ProfilEnum.COORDINATEUR_REGION &&
      session.profil !== ProfilEnum.COORDINATEUR_DEPARTEMENT
    ) {
      throw new UnauthorizedError("coucou");
    }

    return getContainer("rapportsHebdomadaires")
      .resolve("listerRapportsHebdomadairesQuery")
      .run(session.user.id);
  }),

  récupérer: procédureProtégée
    .input(
      z.object({
        rapportId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { session } = ctx;

      if (
        session.profil !== ProfilEnum.COORDINATEUR_REGION &&
        session.profil !== ProfilEnum.COORDINATEUR_DEPARTEMENT
      ) {
        throw new UnauthorizedError("coucou");
      }

      return getContainer("rapportsHebdomadaires")
        .resolve("recupererRapportHebdomadaireQuery")
        .run(input.rapportId, session.user.id);
    }),
});
