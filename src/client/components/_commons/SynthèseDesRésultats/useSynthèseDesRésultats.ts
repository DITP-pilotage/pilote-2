import { useState, useEffect } from 'react';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS } from '@/validation/synthèseDesRésultats';

export default function useSynthèseDesRésultats(synthèseDesRésultatsInitiale: SynthèseDesRésultats, rechargerChantier: () => void) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [modeÉdition, setModeÉdition] = useState(false);
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);
  const [afficherBoutonsAffichage, setAfficherBoutonsAffichage] = useState(false);
  const [synthèseDesRésultats, setSynthèseDesRésultats] = useState(synthèseDesRésultatsInitiale);
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const désactiverLeModeÉdition = () => {
    setModeÉdition(false);
  };

  const activerLeModeÉdition = () => {
    setModeÉdition(true);
  };

  const déplierLeContenu = () => {
    setAfficherContenuComplet(true);
  };

  const replierLeContenu = () => {
    setAfficherContenuComplet(false);
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

  useEffect(() => {
    setAfficherBoutonsAffichage((synthèseDesRésultats?.contenu.length ?? 0) > LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS);
    setAfficherContenuComplet(false);
  }, [synthèseDesRésultats]);

  return {
    activerLeModeÉdition,
    désactiverLeModeÉdition,
    synthèseDesRésultatsCréée,
    synthèseDesRésultats,
    modeÉdition,
    alerte,
    setAlerte,
    déplierLeContenu, 
    replierLeContenu,
    afficherContenuComplet,
    afficherBoutonsAffichage,
  };
}
