import { useFormContext } from 'react-hook-form';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default function useRécapitulatifUtilisateur() {
  const { getValues } = useFormContext();
  const données = getValues();

  const habilitationsDéfaut = {
    lecture: {
      chantiers: [],
      territoires: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
    },
    'saisie.commentaire': {
      chantiers: [],
      territoires: [],
    },
  };

  const utilisateur : Utilisateur = {
    email: données.email,
    nom : données.nom,
    prénom : données.prénom,
    fonction : données.fonction,
    profil : données.profil,
    habilitations : habilitationsDéfaut,
    dateModification : new Date().toISOString(),
    auteurModification: 'Test',
  };

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        console.log('Une erreur est survenue, veuillez réessayer ultérieurement.');
      }
    },
  });

  const envoyerFormulaireUtilisateur = () => {
    mutationCréerUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
  };

  return {
    utilisateur: utilisateur,
    envoyerFormulaireUtilisateur: envoyerFormulaireUtilisateur,
  };
}

