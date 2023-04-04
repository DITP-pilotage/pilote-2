import router from 'next/router';
import { useState, useEffect } from 'react';
import { Météo } from '@/server/domain/météo/Météo.interface';
import api from '@/server/infrastructure/api/trpc/api';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useSynthèseDesRésultats() {
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const mutation = api.chantier.créerUneSynthèseDesRésultats.useMutation();
  const [modeÉdition, setModeÉdition] = useState(false);
    
  useEffect(() => {
    setModeÉdition(false);
  }, [territoireSélectionné]);
  
  function créerSynthèseDesRésultats(contenu: string, météo: Météo, csrf: string) {
    const chantierId = router.query.id as string;

    mutation.mutate({
      contenu,
      météo,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId,
    });
  }

  return {
    nomTerritoireSélectionné: territoireSélectionné.nom,
    créerSynthèseDesRésultats,
    modeÉdition,
    setModeÉdition,
    mutation,
  };
}
