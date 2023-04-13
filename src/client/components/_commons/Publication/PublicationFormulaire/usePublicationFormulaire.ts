import router from 'next/router';
import { SubmitHandler } from 'react-hook-form';
import { récupérerUnCookie } from '@/client/utils/cookies';
import api from '@/server/infrastructure/api/trpc/api';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { validationPublicationContexte, validationPublicationFormulaire, zodValidateurCSRF } from '@/validation/publication';
import PublicationFormulaireProps, { PublicationFormulaireInputs } from './PublicationFormulaire.interface';

export default function usePublicationFormulaire(succèsCallback: PublicationFormulaireProps['succèsCallback'], erreurCallback: PublicationFormulaireProps['erreurCallback']) {
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const mutationCréerPublication = api.publication.créer.useMutation({
    onSuccess: (publicationCréée) => publicationCréée && succèsCallback?.(publicationCréée),
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        erreurCallback?.('Une erreur est survenue, veuillez réessayer ultérieurement.');
      }
    },
  });

  const créerPublication : SubmitHandler<PublicationFormulaireInputs> = data => {
    const inputs = validationPublicationContexte.merge(zodValidateurCSRF).and(validationPublicationFormulaire).parse({
      contenu: data.contenu,
      type: data.type,
      entité: data.entité,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId: router.query.id as string,
      csrf: récupérerUnCookie('csrf') ?? '',
    });

    mutationCréerPublication.mutate(inputs);
  };

  return {
    créerPublication,
  };
}
