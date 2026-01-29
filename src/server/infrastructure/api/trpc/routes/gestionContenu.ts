import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureNonConnecte,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { validationContenu } from "@/validation/gestion-contenu";
import { ModifierMessageInformationUseCase } from "@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { RécupérerMessageInformationUseCase } from "@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase";
import { presenterEnMessageInformationContrat } from "@/server/app/contrats/MessageInformationContrat";
import { RécupérerVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase";
import { VARIABLE_CONTENU_DISPONIBLE_ENV } from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { getContainer } from "@/server/dependances";

export const validationVariableContenu = z.object({
  nomVariableContenu: z.enum(VARIABLE_CONTENU_DISPONIBLE_ENV),
});

export const gestionContenuRouter = créerRouteurTRPC({
  modifierBandeauIndisponibilite: procédureProtégée
    .input(validationContenu)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);
      habilitations.verifierAutorisationModificationGestionContenu();

      const modifierMessageInformationUseCase =
        new ModifierMessageInformationUseCase({
          gestionContenuRepository: dependencies.getGestionContenuRepository(),
        });
      return modifierMessageInformationUseCase.run({
        bandeauType: input.bandeauType,
        isBandeauActif: input.isBandeauActif,
        bandeauTexte: input.bandeauTexte,
      });
    }),
  recupererMessageInformation: procédureNonConnecte.query(async () => {
    const récupérerMessageInformationUseCase =
      new RécupérerMessageInformationUseCase({
        gestionContenuRepository: dependencies.getGestionContenuRepository(),
      });
    const messageInformation = await récupérerMessageInformationUseCase.run();
    return presenterEnMessageInformationContrat(messageInformation);
  }),
  recupererVariableContenu: procédureNonConnecte
    .input(validationVariableContenu)
    .query(({ input }) => {
      const récupérerVariableContenuUseCase =
        new RécupérerVariableContenuUseCase();
      return récupérerVariableContenuUseCase.run({
        nomVariableContenu: input.nomVariableContenu,
      });
    }),
});
