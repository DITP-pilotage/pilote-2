import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import { validationInfosBaseUtilisateur } from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';

export const utilisateurRouter = créerRouteurTRPC({
  'créer' : procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';
      console.log('auteur :', auteur);
      return '';
    })

  ,
});
