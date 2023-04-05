import router from 'next/router';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import SynthèseDesRésultatsFormulaireProps, { SynthèseDesRésultatsFormulaireInputs } from './SynthèseDesRésultatsFormulaire.interface';

export default function useSynthèseDesRésultatsFormulaire(synthèseDesRésultatsCrééeCallback: SynthèseDesRésultatsFormulaireProps['synthèseDesRésultatsCrééeCallback']) {
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const mutationCréerSynthèseDesRésultats = api.synthèseDesRésultats.créer.useMutation({
    onSuccess: (synthèseDesRésultatsCréée: SynthèseDesRésultats) => synthèseDesRésultatsCrééeCallback?.(synthèseDesRésultatsCréée),
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          message: 'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  const créerSynthèseDesRésultats : SubmitHandler<SynthèseDesRésultatsFormulaireInputs> = data => {
    mutationCréerSynthèseDesRésultats.mutate({
      contenu: data.contenu,
      météo: data.météo,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId: router.query.id as string,
      csrf: récupérerUnCookie('csrf') ?? '',
    });
  };

  return {
    alerte,
    créerSynthèseDesRésultats,
  };
}
