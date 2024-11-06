import { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import Modale from '@/components/_commons/Modale/Modale';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

import { useModaleSuppressionValeurActuelle }
  from '@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurActuelle/useModaleSuppressionValeurActuelle';

const ModaleSuppressionValeurActuelle: FunctionComponent<{
  indicateur: Indicateur,
  generatedHTMLID: string
  territoireCode: string
}> = ({ indicateur, generatedHTMLID, territoireCode }) => {
  const router = useRouter();

  const {
    supprimerPropositionValeurActuelle,
    estSupprime,
  } = useModaleSuppressionValeurActuelle({
    indicateur,
    territoireCode,
  });

  return (
    <Modale
      fermetureCallback={() => {
        router.replace(router.asPath, undefined, { scroll: false });
      }}
      idHtml={generatedHTMLID}
      tailleModale='lg'
      titre='Suppression de la proposition'
    >
      {
        !estSupprime ? (
          <>
            <p>
              Vous êtes sur le point de supprimer la proposition de valeur actuelle du territoire.
            </p>
            <div className='w-full flex justify-end fr-mt-2w'>
              <button
                aria-controls={generatedHTMLID}
                className='fr-btn fr-btn--secondary fr-mr-2w'
                title='Fermer la fenêtre modale'
                type='button'
              >
                Annuler
              </button>
              <button
                className='fr-btn'
                onClick={() => supprimerPropositionValeurActuelle()}
                type='button'
              >
                Supprimer la proposition
              </button>
            </div>
          </>
        ) : (
          <div>
            La proposition a été correctement supprimé, vous pouvez fermer cette fenêtre.
          </div>
        )
      }

    </Modale>
  );
};

export default ModaleSuppressionValeurActuelle;
