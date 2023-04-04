import router from 'next/router';
import { useState, useEffect } from 'react';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { TRPCClientError } from '@trpc/client';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import api from '@/server/infrastructure/api/trpc/api';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { récupérerUnCookie } from '@/client/utils/cookies';

export default function useSynthèseDesRésultats(synthèseDesRésultatsInitiale: SynthèseDesRésultats) {
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [modeÉdition, setModeÉdition] = useState(false);
  const [synthèseDesRésultats, setSynthèseDesRésultats] = useState(synthèseDesRésultatsInitiale);
  const [alerte, setAlerte] = useState <{ type: 'succès' | 'erreur', message: string } | null>(null);

  const mutation = api.chantier.créerUneSynthèseDesRésultats.useMutation({
    onSuccess: (synthèseDesRésultatsCréée) => {
      setSynthèseDesRésultats(synthèseDesRésultatsCréée);
      setModeÉdition(false);
      setAlerte({
        type: 'succès',
        message: 'Météo et synthèse des résultats publiées',
      });
    },
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          message: 'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  useEffect(() => {
    setSynthèseDesRésultats(synthèseDesRésultatsInitiale);
  }, [synthèseDesRésultatsInitiale]);

  useEffect(() => {
    setModeÉdition(false);
  }, [territoireSélectionné]);
  
  function créerSynthèseDesRésultats(contenu: string, météo: Météo) {
    const chantierId = router.query.id as string;
    const csrf = récupérerUnCookie('csrf') ?? '';

    mutation.mutate({
      contenu,
      météo,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId,
      csrf,
    });

  }

  return {
    synthèseDesRésultats,
    nomTerritoireSélectionné: territoireSélectionné.nom,
    créerSynthèseDesRésultats,
    modeÉdition,
    setModeÉdition,
    alerte,
    setAlerte,
  };
}
