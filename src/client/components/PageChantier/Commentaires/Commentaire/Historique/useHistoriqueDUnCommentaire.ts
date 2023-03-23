import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';

export default function useHistoriqueDUnCommentaire(typeCommentaire: TypeCommentaire) {
  const router = useRouter();
  const chantierId = router.query.id as string; //TODO changer id pour chantierId
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const [historiqueDUnCommentaire, setHistoriqueDUnCommentaire] = useState<DétailsCommentaire[] | null>(null);
  const [estModaleOuverte, setEstModaleOuverte] = useState(false);

  useEffect(() => {
    setHistoriqueDUnCommentaire(null);
  }, [chantierId, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  useEffect(() => {
    if (!chantierId || !estModaleOuverte)
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
  }, [estModaleOuverte]);

  return {
    historiqueDUnCommentaire,
    territoireSélectionné,
    setEstModaleOuverte,
  };
}
