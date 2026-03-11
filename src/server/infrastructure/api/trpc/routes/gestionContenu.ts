import {
  créerRouteurTRPC,
  procédureNonConnecte,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { validationContenu } from "@/validation/gestion-contenu";
import { presenterEnMessageInformationContrat } from "@/server/app/contrats/MessageInformationContrat";
import { RecupererToutesLesVariablesContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererToutesLesVariablesContenuUseCase";
import { getContainer } from "@/server/dependances";

export const gestionContenuRouter = créerRouteurTRPC({
  modifierBandeauIndisponibilite: procédureProtégée
    .input(validationContenu)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationGestionContenu();

      return getContainer("legacy")
        .resolve("modifierMessageInformationUseCase")
        .run({
          bandeauType: input.bandeauType,
          isBandeauActif: input.isBandeauActif,
          bandeauTexte: input.bandeauTexte,
        });
    }),
  recupererMessageInformation: procédureNonConnecte.query(async () => {
    const messageInformation = await getContainer("legacy")
      .resolve("récupérerMessageInformationUseCase")
      .run();
    return presenterEnMessageInformationContrat(messageInformation);
  }),
  recupererToutesLesVariablesContenu: procédureNonConnecte.query(() => {
    return new RecupererToutesLesVariablesContenuUseCase().run();
  }),
});
