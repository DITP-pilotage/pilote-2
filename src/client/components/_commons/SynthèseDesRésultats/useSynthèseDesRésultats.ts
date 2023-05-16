import { useState, useEffect } from 'react';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useSynthèseDesRésultats(synthèseDesRésultatsInitiale: SynthèseDesRésultats, rechargerChantier: () => void) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [modeÉdition, setModeÉdition] = useState(false);
  const [synthèseDesRésultats, setSynthèseDesRésultats] = useState(synthèseDesRésultatsInitiale);
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const désactiverLeModeÉdition = () => {
    setModeÉdition(false);
  };

  const activerLeModeÉdition = () => {
    setModeÉdition(true);
  };

  const synthèseDesRésultatsCréée = (synthèse: SynthèseDesRésultats) => {
    rechargerChantier();
    setSynthèseDesRésultats(synthèse);
    setAlerte({
      type: 'succès',
      titre: 'Météo et synthèse des résultats publiées',
    });
    désactiverLeModeÉdition();
  };

  useEffect(() => {
    setSynthèseDesRésultats(synthèseDesRésultatsInitiale);
    setAlerte(null);
    désactiverLeModeÉdition();
  }, [synthèseDesRésultatsInitiale, territoireSélectionné]);

  return {
    activerLeModeÉdition,
    désactiverLeModeÉdition,
    synthèseDesRésultatsCréée,
    synthèseDesRésultats,
    modeÉdition,
    alerte,
    setAlerte,
  };
}
