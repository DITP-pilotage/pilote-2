import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";

const zodLogLevel = z.nativeEnum($Enums.log_level);
const zodGranularite = z.enum(["heure", "jour", "semaine"]);

export const applicationLogRouter = createTRPCRouter({
  lister: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        taillePage: z.number().int().min(1).max(100).default(50),
        filtreLevel: zodLogLevel.optional(),
        filtreCategorie: z.string().optional(),
        filtreRecherche: z.string().optional(),
        dateDebut: z.string().datetime().optional(),
        dateFin: z.string().datetime().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("listerLogsQuery")
        .run({
          page: input.page,
          taillePage: input.taillePage,
          filtreLevel: input.filtreLevel,
          filtreCategorie: input.filtreCategorie,
          filtreRecherche: input.filtreRecherche,
          dateDebut: input.dateDebut ? new Date(input.dateDebut) : undefined,
          dateFin: input.dateFin ? new Date(input.dateFin) : undefined,
        });
    }),

  statistiques: protectedProcedure
    .input(
      z.object({
        dateDebut: z.string().datetime(),
        dateFin: z.string().datetime(),
        granularite: zodGranularite,
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("obtenirStatistiquesLogsQuery")
        .run({
          dateDebut: new Date(input.dateDebut),
          dateFin: new Date(input.dateFin),
          granularite: input.granularite,
        });
    }),

  purger: protectedProcedure
    .input(
      z.object({
        csrf: z.string(),
        anterieurA: z.string().datetime(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("purgerLogsUseCase")
        .execute({ anterieurA: new Date(input.anterieurA) });
    }),
});
