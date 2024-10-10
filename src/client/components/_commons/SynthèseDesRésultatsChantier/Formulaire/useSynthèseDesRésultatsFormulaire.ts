import router from 'next/router';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import SynthèseDesRésultatsFormulaireProps, { SynthèseDesRésultatsFormulaireInputs } from './Formulaire.interface';

export default function useSynthèseDesRésultatsFormulaire(synthèseDesRésultatsCrééeCallback: SynthèseDesRésultatsFormulaireProps['synthèseDesRésultatsCrééeCallback'], territoireCode: string) {
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);
  
  const mutationCréerSynthèseDesRésultats = api.synthèseDesRésultats.créer.useMutation({
    onSuccess: (synthèseDesRésultatsCréée) => synthèseDesRésultatsCréée && synthèseDesRésultatsCrééeCallback?.(synthèseDesRésultatsCréée),
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre: 'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  const créerSynthèseDesRésultats: SubmitHandler<SynthèseDesRésultatsFormulaireInputs> = data => {
    mutationCréerSynthèseDesRésultats.mutate({
      contenu: data.contenu,
      météo: data.météo,
      territoireCode: territoireCode,
      réformeId: router.query.id as string,
      csrf: récupérerUnCookie('csrf') ?? '',
      typeDeRéforme: 'chantier',
    });
  };

  return {
    alerte,
    créerSynthèseDesRésultats,
  };
}
