import { useEffect, useState } from 'react';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';

export default function useCommentaire(commentaireInitial: Commentaire) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [modeÉdition, setModeÉdition] = useState(false);
  const [commentaire, setCommentaire] = useState(commentaireInitial);
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const désactiverLeModeÉdition = () => {
    setModeÉdition(false);
  };

  const activerLeModeÉdition = () => {
    setModeÉdition(true);
  };

  const commentaireCréé = (c: Commentaire) => {
    setCommentaire(c);
    setAlerte({
      type: 'succès',
      message: 'Commentaire modifié',
    });
    désactiverLeModeÉdition();
  };

  useEffect(() => {
    setCommentaire(commentaireInitial);
    setAlerte(null);
    désactiverLeModeÉdition();
  }, [commentaireInitial, territoireSélectionné]);

  return {
    activerLeModeÉdition,
    désactiverLeModeÉdition,
    commentaireCréé,
    commentaire,
    nomTerritoireSélectionné: territoireSélectionné.nom,
    modeÉdition,
    alerte,
    setAlerte,
  };
}
