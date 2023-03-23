import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';

export function useHistoriqueDuCommentaire(typeCommentaire: TypeCommentaire) {
  const router = useRouter();
  const chantierId = router.query.id as string; //TODO changer id pour chantierId
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const [historiqueDuCommentaire, setHistoriqueDuCommentaire] = useState<DétailsCommentaire[] | null>(null);
  const [estModaleOuverte, setEstModaleOuverte] = useState(false);

  useEffect(() => {
    document.body.style.overflow = estModaleOuverte ? 'hidden' : 'unset';
  }, [estModaleOuverte]);

  useEffect(() => {
    setHistoriqueDuCommentaire(null);
  }, [
    chantierId, typeCommentaire,
    mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee,
  ]);

  useEffect(() => {
    if (!chantierId || !estModaleOuverte)
      return;

    fetch(`/api/chantier/${chantierId}/historique-du-commentaire?`
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
        setHistoriqueDuCommentaire(données.historiqueDuCommentaire ?? []);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chantierId, typeCommentaire, estModaleOuverte,
    mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee,
  ]);

  return {
    historiqueDuCommentaire,
    territoireSélectionné,
    estModaleOuverte,
    setEstModaleOuverte,
  };
}
