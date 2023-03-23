import { useState } from 'react';
import { DétailsCommentaire, CommentaireÀPublier, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useCommentaire(commentaire: DétailsCommentaire | null) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [commentaireÉtat, setCommentaireÉtat] = useState(commentaire);
  const [afficherAlerte, setAfficherAlerte] = useState(false);
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const terriotireSélectionné = territoireSélectionnéTerritoiresStore();

  function auClicPublierCommentaire(contenu: string, type: TypeCommentaire, chantierId: string) {
    const commentaireÀPublier: CommentaireÀPublier = {
      typeCommentaire: type,
      maille: mailleSélectionnée,
      codeInsee: terriotireSélectionné.codeInsee,
      contenu: contenu,
    };
    
    fetch(`/api/chantier/${chantierId}/commentaire/`, {
      method: 'POST',
      body: JSON.stringify(commentaireÀPublier),
    }).then(réponse => {      
      return réponse.json() as Promise<DétailsCommentaire>;
    }).then((détailsNouveauCommentaire) => {
      setCommentaireÉtat(détailsNouveauCommentaire);
      setModeÉdition(false);
      setAfficherAlerte(true);
    });
  }

  return {
    modeÉdition,
    setModeÉdition,
    commentaireÉtat,
    auClicPublierCommentaire,
    afficherAlerte,
    setAfficherAlerte,
  };
}
