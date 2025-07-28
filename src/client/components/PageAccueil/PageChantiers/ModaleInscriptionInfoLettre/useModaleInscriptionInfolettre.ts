import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import api from '@/server/infrastructure/api/trpc/api';
import { récupérerUnCookie } from '@/client/utils/cookies';

interface InscriptionInfoLettreForm {
  consentement: boolean;
  emailUtilisateur: string;
}

export const useModaleInscriptionInfolettre = () => {
  const { data: session } = useSession();
  const [succesEnvoieEmail, setSuccesEnvoieEmail] = useState<boolean>(false);

  const envoyerMailInscriptionInfolettre = api.utilisateur.envoyerMailInscriptionInfolettre.useMutation({
    onSuccess: () => {
      setSuccesEnvoieEmail(true);
    },
  });
  const desactiverPopupInfolettre = api.utilisateur.desactiverPopupInfolettre.useMutation();

  const { handleSubmit, register, watch } = useForm<InscriptionInfoLettreForm>({
    mode: 'all',
    defaultValues: {
      consentement: false,
      emailUtilisateur: session?.user.email ?? '',
    },
  });

  const handleFermetureModale = () => {
    if (session?.user.id) {
      desactiverPopupInfolettre.mutate({
        csrf: récupérerUnCookie('csrf') ?? '',
        utilisateurId: session.user.id,
      });
    }
  };

  const handleSubmitForm = handleSubmit((data: InscriptionInfoLettreForm) => {
    envoyerMailInscriptionInfolettre.mutate({
      csrf: récupérerUnCookie('csrf') ?? '',
      utilisateurEmail: data.emailUtilisateur,
      lienConfirmationInscription: `${process.env.NEXT_PUBLIC_BASE_URL}/inscription`,
    });
  });

  const estConsentantALinscription = watch('consentement');

  return {
    session,
    register,
    watch,
    handleFermetureModale,
    handleSubmitForm,
    estConsentantALinscription,
    isSubmitting: envoyerMailInscriptionInfolettre.isLoading,
    isDesactivating: desactiverPopupInfolettre.isLoading,
    succesEnvoieEmail,
  };
}; 
