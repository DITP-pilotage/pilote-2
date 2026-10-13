import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ForbiddenError } from "@/shared/errors/forbidden-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
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
