import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';

export default function useRécapitulatifUtilisateur() {
  const { getValues } = useFormContext<UtilisateurFormInputs>();
  const utilisateur = getValues();
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const mutationCréerUtilisateur = api.utilisateur.créer.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?compteCréé=true');
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

  const mutationModifierUtilisateur = api.utilisateur.modifier.useMutation({
    onSuccess: () => {
      router.push('/admin/utilisateurs?compteModifié=true');
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

  const envoyerFormulaireUtilisateur = (utilisateurExistant: boolean) => {
    if (utilisateurExistant) 
      mutationModifierUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
    else
      mutationCréerUtilisateur.mutate({ ...utilisateur, 'csrf': récupérerUnCookie('csrf') ?? '' });
  };

  return {
    utilisateur,
    envoyerFormulaireUtilisateur,
    alerte,
  };
}

