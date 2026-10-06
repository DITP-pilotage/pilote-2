import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const rapportHebdomadaireRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;

    const habilitations = await getContainer("gestionUtilisateur")
      .resolve("habilitationService")
      .recupererHabilitations(session);
    habilitations.verifierAutorisationLectureRapportsHebdomadaires();

    return getContainer("rapportsHebdomadaires")
      .resolve("listerRapportsHebdomadairesQuery")
      .run(session.user.id);
  }),

  get: protectedProcedure
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
