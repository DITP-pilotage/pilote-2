import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";
import { presenterEnListeNouveauteContrat } from "@/server/parametrage-nouveautes/app/contrats/NouveauteContrat";
export const parametrageNouveautesRouter = createTRPCRouter({
  creer: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        contenu: z.string(),
        version: z.string(),
        date: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAutoriseAModifierLesNouveautes =
        ctx.session.profil === ProfilEnum.DITP_ADMIN;

      if (!estAutoriseAModifierLesNouveautes) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageNouveautes")
        .resolve("creerNouveauteUseCase")
        .execute({
          id: input.id,
          contenu: input.contenu,
          version: input.version,
          date: input.date,
        });
    }),

  lister: protectedProcedure.query(async () => {
    return presenterEnListeNouveauteContrat(
      await getContainer("parametrageNouveautes")
        .resolve("listerNouveautesUseCase")
        .execute(),
    );
  }),

  modifier: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contenu: z.string(),
        version: z.string(),
        date: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAutoriseAModifierLesNouveautes =
        ctx.session.profil === ProfilEnum.DITP_ADMIN;

      if (!estAutoriseAModifierLesNouveautes) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageNouveautes")
        .resolve("modifierNouveauteUseCase")
        .execute({
          id: input.id,
          contenu: input.contenu,
          version: input.version,
          date: input.date,
        });
    }),
});
