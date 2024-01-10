import { useEffect, useState } from 'react';
import { LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS } from '@/validation/synthèseDesRésultats';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default function useAffichage(synthèseDesRésultats: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']) {
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);
  const [afficherBoutonsAffichage, setAfficherBoutonsAffichage] = useState(false);
  const [contenuAAfficher, setContenuAAfficher] = useState('');

  const déplierLeContenu = () => {
    setAfficherContenuComplet(true);
  };
    
  const replierLeContenu = () => {
    setAfficherContenuComplet(false);
  };
    
  useEffect(() => {
    setAfficherBoutonsAffichage((synthèseDesRésultats?.contenu.length ?? 0) > LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS);
    setAfficherContenuComplet(false);
  }, [synthèseDesRésultats]);
  
  useEffect(() => {
    if (!!synthèseDesRésultats) {
      setContenuAAfficher(
        afficherContenuComplet || synthèseDesRésultats.contenu.length <= LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS 
          ? synthèseDesRésultats.contenu 
          : synthèseDesRésultats.contenu.slice(0, LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS) + '...',
      );
    }
  }, [synthèseDesRésultats, afficherContenuComplet]);
  

  return {
    contenuAAfficher, 
    afficherBoutonsAffichage,
    afficherContenuComplet,
    déplierLeContenu,
    replierLeContenu,
  };
}
