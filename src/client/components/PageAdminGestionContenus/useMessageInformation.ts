import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { validationContenu } from '@/validation/gestion-contenu';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';

export type ContenuForm = {
  isBandeauActif: boolean
  bandeauTexte: string
  bandeauType: string
};
export const useMessageInformation = () => {
  const router = useRouter();
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const reactHookForm = useForm<ContenuForm>({
    resolver: zodResolver(validationContenu),
  });

  const mutationModifierBandeauIndisponibilite = api.gestionContenu.modifierBandeauIndisponibilite.useMutation({
    onSuccess: () => {
      return router.push('/admin/message-information?_action=modification-reussie');
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

  const modifierIndicateur: SubmitHandler<ContenuForm> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
    };

    mutationModifierBandeauIndisponibilite.mutate(inputs);
  };

  return { modifierIndicateur, reactHookForm };
};
