import { z } from "zod";

import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const rapportHebdomadaireRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    const { session } = ctx;

    const habilitations = await getContainer("gestionUtilisateur")
      .resolve("habilitationService")
      .recupererHabilitations(session);
    habilitations.verifierAutorisationLectureRapportsHebdomadaires();

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

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(session);
      habilitations.verifierAutorisationLectureRapportsHebdomadaires();

      return getContainer("rapportsHebdomadaires")
        .resolve("recupererRapportHebdomadaireQuery")
        .run(input.rapportId, session.user.id);
    }),
});
