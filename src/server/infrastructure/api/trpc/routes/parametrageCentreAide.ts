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

const vérifierAdmin = (profil: string) => {
  if (profil !== ProfilEnum.DITP_ADMIN) {
    throw new UnauthorizedError(
      "Vous n'êtes pas autorisé à effectuer cette action",
    );
  }
};

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
      vérifierAdmin(ctx.session.profil);

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
        contenuPublie: z.string().nullish(),
        titrePublie: z.string().nullish(),
        estPublie: z.boolean().optional(),
        estMasque: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("modifierArticleCentreAideUseCase")
        .execute({
          id: input.id,
          titre: input.titre,
          contenu: input.contenu,
          type: input.type,
          ordre: input.ordre,
          parentId: input.parentId,
          contenuPublie: input.contenuPublie,
          titrePublie: input.titrePublie,
          estPublie: input.estPublie,
          estMasque: input.estMasque,
        });
    }),

  supprimer: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("supprimerArticleCentreAideUseCase")
        .execute({ id: input.id });
    }),

  publier: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("publierArticleCentreAideUseCase")
        .execute({ id: input.id });
    }),

  depublier: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("depublierArticleCentreAideUseCase")
        .execute({ id: input.id });
    }),

  basculerVisibilite: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("basculerVisibiliteArticleCentreAideUseCase")
        .execute({ id: input.id });
    }),
});
