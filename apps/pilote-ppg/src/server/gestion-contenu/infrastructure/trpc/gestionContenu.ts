import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { validationContenu } from "@/validation/gestion-contenu";
import { validationFeatureFlip } from "@/validation/feature-flip";
import { presenterEnMessageInformationContrat } from "@/server/app/contrats/MessageInformationContrat";
import { getContainer } from "@/server/dependances";

export const gestionContenuRouter = createTRPCRouter({
  modifierBandeauIndisponibilite: protectedProcedure
    .input(validationContenu)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationGestionContenu();

      return getContainer("gestionContenu")
        .resolve("modifierMessageInformationUseCase")
        .run({
          bandeauType: input.bandeauType,
          isBandeauActif: input.isBandeauActif,
          bandeauTexte: input.bandeauTexte,
        });
    }),
  recupererMessageInformation: publicProcedure.query(async () => {
    const messageInformation = await getContainer("gestionContenu")
      .resolve("récupérerMessageInformationUseCase")
      .run();
    return presenterEnMessageInformationContrat(messageInformation);
  }),
  recupererToutesLesVariablesContenu: publicProcedure.query(async () => {
    return getContainer("gestionContenu")
      .resolve("recupererToutesLesVariablesContenuUseCase")
      .run();
  }),
  recupererFeatureFlips: protectedProcedure.query(async ({ ctx }) => {
    const habilitations = await getContainer("gestionUtilisateur")
      .resolve("habilitationService")
      .recupererHabilitations(ctx.session);
    habilitations.verifierAutorisationModificationGestionContenu();

    return getContainer("gestionContenu")
      .resolve("recupererFeatureFlipsUseCase")
      .run();
  }),
  modifierFeatureFlips: protectedProcedure
    .input(validationFeatureFlip)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationGestionContenu();

      return getContainer("gestionContenu")
        .resolve("modifierFeatureFlipUseCase")
        .run({ featureFlips: input.featureFlips });
    }),
});
