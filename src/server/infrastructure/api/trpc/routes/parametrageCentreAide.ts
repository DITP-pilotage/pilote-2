import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { presenterEnListeArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

const TypeArticleCentreAideSchema = z.enum(["GROUPE", "PAGE"]);

export const parametrageCentreAideRouter = créerRouteurTRPC({
  creer: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
        titre: z.string(),
        contenu: z.string().nullish(),
        type: TypeArticleCentreAideSchema,
        ordre: z.number(),
        parentId: z.string().uuid().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageCentreAide")
        .resolve("creerArticleCentreAideUseCase")
        .execute({
          id: input.id,
          titre: input.titre,
          contenu: input.contenu,
          type: input.type,
          ordre: input.ordre,
          parentId: input.parentId,
        });
    }),

  lister: procédureProtégée.query(async () => {
    return presenterEnListeArticleCentreAideContrat(
      await getContainer("parametrageCentreAide")
        .resolve("listerArticlesCentreAideUseCase")
        .execute(),
    );
  }),

  modifier: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
        titre: z.string(),
        contenu: z.string().nullish(),
        type: TypeArticleCentreAideSchema,
        ordre: z.number(),
        parentId: z.string().uuid().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageCentreAide")
        .resolve("modifierArticleCentreAideUseCase")
        .execute({
          id: input.id,
          titre: input.titre,
          contenu: input.contenu,
          type: input.type,
          ordre: input.ordre,
          parentId: input.parentId,
        });
    }),

  supprimer: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError(
          "Vous n'êtes pas autorisé à effectuer cette action",
        );
      }

      return getContainer("parametrageCentreAide")
        .resolve("supprimerArticleCentreAideUseCase")
        .execute({ id: input.id });
    }),
});
