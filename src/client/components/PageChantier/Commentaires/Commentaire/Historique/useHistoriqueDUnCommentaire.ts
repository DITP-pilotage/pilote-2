import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';

export function useHistoriqueDUnCommentaire(typeCommentaire: TypeCommentaire, estAffiché: boolean) {
  const router = useRouter();
  const chantierId = router.query.id as string; //TODO changer id pour chantierId
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const [historiqueDUnCommentaire, setHistoriqueDUnCommentaire] = useState<DétailsCommentaire[] | null>(null);

  useEffect(() => {
    setHistoriqueDUnCommentaire(null);
  }, [chantierId, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  useEffect(() => {
    if (!chantierId || !estAffiché)
      return;

    fetch(`/api/chantier/${chantierId}/historique-d-un-commentaire?`
      + new URLSearchParams({
        chantierId,
        maille: mailleAssociéeAuTerritoireSélectionné,
        codeInsee: territoireSélectionné.codeInsee,
        type: typeCommentaire,
      }))
      .then(réponse => {
        return réponse.json();
      })
      .then(données => {
        // TODO améliorer la gestion d'erreur
        setHistoriqueDUnCommentaire(données.historiqueDUnCommentaire ?? []);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estAffiché]);

  return {
    historiqueDUnCommentaire,
    territoireSélectionné,
  };
}
