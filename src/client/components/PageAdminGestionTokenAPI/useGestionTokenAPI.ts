import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { validationCreationTokenAPI } from '@/validation/gestion-token-api';

export type TokenAPIForm = {
  email: string
};

export const useGestionTokenAPI = () => {
  const router = useRouter();
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const reactHookForm = useForm<TokenAPIForm>({
    resolver: zodResolver(validationCreationTokenAPI),
  });

  const mutationCreerTokenAPI = api.gestionTokenAPI.creerTokenAPI.useMutation({
    onSuccess: async (result) => {
      try {
        await navigator.clipboard.writeText(result);
      } catch (error) {
        return error;
      }

      setAlerte({
        type: 'succès',
        titre : 'Le token d’authentification est généré pour cet utilisateur et est sauvegardé dans votre presse-papier.',
        message: result,
      });
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });

  const mutationSupprimerTokenAPI = api.gestionTokenAPI.supprimerTokenAPI.useMutation({
    onSuccess: () => {
      router.push('/admin/gestion-token-api?_action=suppression-reussie');
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });

  const creerTokenAPI: SubmitHandler<TokenAPIForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
    };

    mutationCreerTokenAPI.mutate(inputs);
  };

  const supprimerTokenAPI: SubmitHandler<TokenAPIForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
    };

    mutationSupprimerTokenAPI.mutate(inputs);
  };

  return { creerTokenAPI, supprimerTokenAPI, reactHookForm, alerte };
};
