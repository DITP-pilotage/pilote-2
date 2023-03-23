import { useState } from 'react';
import { DétailsCommentaire, NouveauCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useCommentaire(commentaire: DétailsCommentaire | null) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [commentaireÉtat, setCommentaireÉtat] = useState(commentaire);
  const [afficherAlerte, setAfficherAlerte] = useState(false);
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const terriotireSélectionné = territoireSélectionnéTerritoiresStore();

  function handlePublierCommentaire(contenu: string, type: TypeCommentaire, auteur: string, chantierId: string) {
    const nouveauCommentaire: NouveauCommentaire = {
      typeCommentaire: type,
      maille: mailleSélectionnée,
      codeInsee: terriotireSélectionné.codeInsee,
      détailsCommentaire: { contenu: contenu, date: new Date().toISOString(), auteur: auteur },
    };
    
    fetch(`/api/chantier/${chantierId}/commentaire/`, {
      method: 'POST',
      body: JSON.stringify(nouveauCommentaire),
    }).then(() => {
      setCommentaireÉtat(nouveauCommentaire.détailsCommentaire);
      setModeÉdition(false);
      setAfficherAlerte(true);
    });
  }

  return {
    modeÉdition,
    setModeÉdition,
    commentaireÉtat,
    handlePublierCommentaire,
    afficherAlerte,
    setAfficherAlerte,
  };
}
