import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ajouterLesChantierAuxHabilitationsCommandSchema } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";

export const habilitationsCoordinateurRouter = createTRPCRouter({
  ajouterChantierAuxHabilitations: protectedProcedure
    .input(ajouterLesChantierAuxHabilitationsCommandSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new ForbiddenError(
          "Seuls les administrateurs DITP peuvent effectuer cette action",
        );
      }

      await getContainer("habilitationsCoordinateur")
        .resolve("ajouterLesChantierAuxHabilitationsHandler")
        .execute(input);
    }),
});
