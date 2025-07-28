import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { presenterEnListeNouveauteContrat } from "@/server/parametrage-nouveautes/app/contrats/NouveauteContrat";
export const parametrageNouveautesRouter = créerRouteurTRPC({
  creer: procédureProtégée
    .input(
      z.object({
        contenu: z.string(),
        version: z.string(),
        date: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAutoriseAModifierLesNouveautés =
        ctx.session.profil === ProfilEnum.DITP_ADMIN;

      if (!estAutoriseAModifierLesNouveautés) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageNouveautes")
        .resolve("creerNouveauteUseCase")
        .execute({
          contenu: input.contenu,
          version: input.version,
          date: input.date,
        });
    }),

  lister: procédureProtégée.query(async () => {
    return presenterEnListeNouveauteContrat(
      await getContainer("parametrageNouveautes")
        .resolve("listerNouveautesUseCase")
        .execute(),
    );
  }),

  modifier: procédureProtégée
    .input(
      z.object({
        id: z.string(),
        contenu: z.string(),
        version: z.string(),
        date: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAutoriseAModifierLesNouveautés =
        ctx.session.profil === ProfilEnum.DITP_ADMIN;

      if (!estAutoriseAModifierLesNouveautés) {
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
