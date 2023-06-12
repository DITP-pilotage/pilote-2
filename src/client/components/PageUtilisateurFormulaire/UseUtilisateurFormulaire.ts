import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { zodValidateurCSRF } from '@/validation/publication';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { UtilisateurFormInputs } from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import { validationInfosBaseUtilisateur } from '@/validation/utilisateur';
import api from '@/server/infrastructure/api/trpc/api';

export default function useUtilisateurFormulaire(profils: Profil[]) {
  const { register, handleSubmit, formState: { errors } } = useForm<UtilisateurFormInputs>({
    mode:'onChange',
    reValidateMode:'onChange',
    resolver: zodResolver(validationInfosBaseUtilisateur),
  });

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        erreurCallback?.('Une erreur est survenue, veuillez réessayer ultérieurement.');
      }
    },
  });

  const créerUtilisateur: SubmitHandler<UtilisateurFormInputs> = data => {
    const inputs = validationInfosBaseUtilisateur.merge(zodValidateurCSRF).parse({
      email: data.email,
      nom: data.nom,
      prénom: data.prénom,
      fonction: data.fonction,
      profil: data.profil,
      csrf: récupérerUnCookie('csrf') ?? '',
    });

    mutationCréerUtilisateur.mutate(inputs);
  };

  const listeProfils = profils.map(profil => ({
    libellé: profil.nom,
    valeur: profil.code,
  }));

  return {
    listeProfils,
    register,
    handleSubmit,
    créerUtilisateur,
    erreurs: errors,
  };
}
