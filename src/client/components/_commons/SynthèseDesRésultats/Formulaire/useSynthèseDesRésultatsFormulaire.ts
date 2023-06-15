import router from 'next/router';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import SynthèseDesRésultatsFormulaireProps, { SynthèseDesRésultatsFormulaireInputs } from './Formulaire.interface';

export default function useSynthèseDesRésultatsFormulaire(synthèseDesRésultatsCrééeCallback: SynthèseDesRésultatsFormulaireProps['synthèseDesRésultatsCrééeCallback']) {
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);
  
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const mutationCréerSynthèseDesRésultats = api.synthèseDesRésultats.créer.useMutation({
    onSuccess: (synthèseDesRésultatsCréée: SynthèseDesRésultats) => synthèseDesRésultatsCrééeCallback?.(synthèseDesRésultatsCréée),
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
      territoireCode: territoireSélectionné!.code,
      réformeId: router.query.id as string,
      csrf: récupérerUnCookie('csrf') ?? '',
      typeDeRéforme: typeDeRéforme,
    });
  };

  return {
    alerte,
    créerSynthèseDesRésultats,
  };
}
