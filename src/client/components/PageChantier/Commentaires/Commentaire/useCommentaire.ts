import { useState } from 'react';
import router from 'next/router';
import { DétailsCommentaire, CommentaireÀCréer, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useCommentaire(commentaire: DétailsCommentaire | null, type: TypeCommentaire) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [commentaireÉtat, setCommentaireÉtat] = useState(commentaire);
  const [alerte, setAlerte] = useState <{ type: 'succès' | 'erreur', message: string } | null>(null);
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  function créerUnCommentaire(contenu: string, csrf: string) {
    const chantierId = router.query.id as string; 
    
    const commentaireÀCréer: CommentaireÀCréer = {
      typeCommentaire: type,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      contenu: contenu,
    };
    
    fetch(`/api/chantier/${chantierId}/commentaire/`, {
      method: 'POST',
      body: JSON.stringify({
        commentaireÀCréer,
        csrf,
      }),
    }).then(réponse => {
      if (!réponse.ok) {
        if (réponse.status === 500) {
          setAlerte({ type: 'erreur', message: 'Le serveur est indisponible, veuillez réessayer ultérieurement' });
        } else {
          setAlerte({ type: 'erreur', message: "Une erreur s'est produite, veuillez actualiser la page" });
        } 
      }
      return réponse.json() as Promise<DétailsCommentaire>;
    }).then(détailsNouveauCommentaire => {
      setCommentaireÉtat(détailsNouveauCommentaire);
      setModeÉdition(false);
      setAlerte({ type: 'succès', message: 'Commentaire modifié' });
    });
  }

  return {
    modeÉdition,
    setModeÉdition,
    commentaireÉtat,
    setCommentaireÉtat,
    créerUnCommentaire,
    alerte,
    setAlerte,
  };
}
