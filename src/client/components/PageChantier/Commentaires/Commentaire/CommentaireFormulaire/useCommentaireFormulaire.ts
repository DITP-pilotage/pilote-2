import router from 'next/router';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import CommentaireFormulaireProps, { CommentaireFormulaireInputs } from './CommentaireFormulaire.interface';

export default function useCommentaireFormulaire(commentaireCrééCallback: CommentaireFormulaireProps['commentaireCrééCallback']) {
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const mutationCréerCommentaire = api.commentaire.créer.useMutation({
    onSuccess: (commentaireCréé: Commentaire) => commentaireCrééCallback?.(commentaireCréé),
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          message: 'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  const créerCommentaire : SubmitHandler<CommentaireFormulaireInputs> = data => {
    mutationCréerCommentaire.mutate({
      contenu: data.contenu,
      type: data.type,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId: router.query.id as string,
      csrf: récupérerUnCookie('csrf') ?? '',
    });
  };

  return {
    alerte,
    créerCommentaire,
  };
}
