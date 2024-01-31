import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationContenu } from '@/validation/gestion-contenu';
import { ModifierMessageInformationUseCase } from '@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { RécupérerMessageInformationUseCase } from '@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase';
import { presenterEnMessageInformationContrat } from '@/server/app/contrats/MessageInformationContrat';

export const gestionContenuRouter = créerRouteurTRPC({
  modifierBandeauIndisponibilite: procédureProtégée
    .input(validationContenu)
    .mutation(({ input }) => {
      
      const modifierMessageInformationUseCase = new ModifierMessageInformationUseCase({ gestionContenuRepository: dependencies.getGestionContenuRepository() });
      return modifierMessageInformationUseCase.run({ bandeauType: input.bandeauType, isBandeauActif: input.isBandeauActif, bandeauTexte: input.bandeauTexte });
    }),
  récupérerMessageInformation: procédureProtégée
    .query(() => {
      const récupérerMessageInformationUseCase = new RécupérerMessageInformationUseCase({ gestionContenuRepository: dependencies.getGestionContenuRepository() });
      return récupérerMessageInformationUseCase.run().then(presenterEnMessageInformationContrat);
    }),
});
