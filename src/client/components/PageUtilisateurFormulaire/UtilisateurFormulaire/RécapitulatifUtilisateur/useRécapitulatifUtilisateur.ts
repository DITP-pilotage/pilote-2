import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';

export default function useRécapitulatifUtilisateur() {
  const { getValues } = useFormContext<UtilisateurFormInputs>();
  const données = getValues();
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const habilitationsDéfaut = {
    lecture: {
      chantiers: données.habilitations.lecture.chantiers ?? [],
      territoires: données.habilitations.lecture.territoires ?? [],
      périmètres: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.commentaire': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  };

  const utilisateur = {
    email: données.email,
    nom : données.nom,
    prénom : données.prénom,
    fonction : données.fonction,
    profil : données.profil,
    habilitations : habilitationsDéfaut,
  };

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?comptecréé=true');
    },
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre :'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  const envoyerFormulaireUtilisateur = () => {
    mutationCréerUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
  };

  return {
    utilisateur,
    envoyerFormulaireUtilisateur,
    alerte,
  };
}

