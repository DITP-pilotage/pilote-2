import { z } from 'zod';
import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationContenu } from '@/validation/gestion-contenu';
import { ModifierMessageInformationUseCase } from '@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { RécupérerMessageInformationUseCase } from '@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase';
import { presenterEnMessageInformationContrat } from '@/server/app/contrats/MessageInformationContrat';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { VARIABLE_CONTENU_DISPONIBLE_ENV } from '@/server/gestion-contenu/domain/VariableContenuDisponible';

export const validationVariableContenu = z.object({
  nomVariableContenu: z.enum(VARIABLE_CONTENU_DISPONIBLE_ENV),
});
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
  récupérerVariableContenu: procédureProtégée
    .input(validationVariableContenu)
    .query<number | boolean>(({ input }) => {
    const récupérerVariableContenuUseCase = new RécupérerVariableContenuUseCase();
    return récupérerVariableContenuUseCase.run({ nomVariableContenu: input.nomVariableContenu });
  }),
});
