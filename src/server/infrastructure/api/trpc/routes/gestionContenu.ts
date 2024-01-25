import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationContenu } from '@/validation/gestion-contenu';

export const gestionContenuRouter = créerRouteurTRPC({
  modifierBandeauIndisponibilite: procédureProtégée
    .input(validationContenu)
    .mutation(({ input }) => {
      
      console.log(input);
    }),
});
