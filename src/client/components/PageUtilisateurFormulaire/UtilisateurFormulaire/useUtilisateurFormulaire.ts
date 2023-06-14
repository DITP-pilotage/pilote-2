import { SubmitHandler } from 'react-hook-form';
import { zodValidateurCSRF } from '@/validation/publication';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { UtilisateurFormInputs } from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import { validationInfosBaseUtilisateur } from '@/validation/utilisateur';

export default function useUtilisateurFormulaire() {
/*  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        erreurCallback?.('Une erreur est survenue, veuillez réessayer ultérieurement.');
      }
    },
  });*/

  const créerUtilisateur: SubmitHandler<UtilisateurFormInputs> = data => {
    const inputs = validationInfosBaseUtilisateur.merge(zodValidateurCSRF).parse({
      email: data.email,
      nom: data.nom,
      prénom: data.prénom,
      fonction: data.fonction,
      profil: data.profil,
      csrf: récupérerUnCookie('csrf') ?? '',
    });

    console.log(inputs);

    //mutationCréerUtilisateur.mutate(inputs);
  };



  return {
    créerUtilisateur,
  };
}
