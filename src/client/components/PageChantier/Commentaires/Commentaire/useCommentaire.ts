import { useState } from 'react';
import router from 'next/router';
import { DétailsCommentaire, CommentaireÀCréer, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useCommentaire(commentaire: DétailsCommentaire | null, type: TypeCommentaire) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [commentaireÉtat, setCommentaireÉtat] = useState(commentaire);
  const [afficherAlerte, setAfficherAlerte] = useState(false);
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const terriotireSélectionné = territoireSélectionnéTerritoiresStore();

  function créerUnCommentaire(contenu: string | undefined, csrf: string | undefined) {
    const chantierId = router.query.id as string; 

    if (contenu === undefined || contenu === '') {
      return;
    }
    
    const commentaireÀCréer: CommentaireÀCréer = {
      typeCommentaire: type,
      maille: mailleSélectionnée,
      codeInsee: terriotireSélectionné.codeInsee,
      contenu: contenu,
    };
    
    fetch(`/api/chantier/${chantierId}/commentaire/`, {
      method: 'POST',
      body: JSON.stringify({
        commentaireÀCréer,
        csrf,
      }),
    }).then(réponse => {      
      return réponse.json() as Promise<DétailsCommentaire>;
    }).then((détailsNouveauCommentaire) => {
      setCommentaireÉtat(détailsNouveauCommentaire);
      setModeÉdition(false);
      setAfficherAlerte(true);
    }).catch();
  }

  return {
    modeÉdition,
    setModeÉdition,
    commentaireÉtat,
    setCommentaireÉtat,
    créerUnCommentaire,
    afficherAlerte,
    setAfficherAlerte,
  };
}
