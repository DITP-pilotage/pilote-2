import { useRouter } from 'next/router';
import { FunctionComponent } from 'react';
import { MailleInterne } from '@/server/chantiers/domain/Maille';
import { maillesAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import SélecteurMailleStyled from './SélecteurMaille.styled';

const SélecteurMaille: FunctionComponent<{
  pathname: string,
  mailleQuery: MailleInterne
}> = ({ pathname, mailleQuery }) => {
  const maillesAccessiblesEnLecture = maillesAccessiblesEnLectureStore();
  const router = useRouter();

  const maillesInternesAccessiblesEnLecture = maillesAccessiblesEnLecture.filter((maille): maille is MailleInterne => maille !== 'nationale');

  const mailles: Record<MailleInterne, string> = {
    'regionale': 'Régions',
    'departementale': 'Départements',
  };

  if (maillesInternesAccessiblesEnLecture.length <= 1) {
    return null;
  }

  const changerMaille = (maille: MailleInterne) => {
    const initialeTerritoireCode = router.query.territoireCode as string;

    sauvegarderFiltres({ territoireCode: initialeTerritoireCode, maille });

    delete router.query._action;
    delete router.query.pageIndex;
    return router.push({
      pathname,
      query: { ...router.query, maille },
    },
    undefined, {
      scroll: false,
    });
  };

  return (
    <SélecteurMailleStyled className='fr-px-1v fr-pb-3w w-full'>
      <div className='flex justify-center tag-liste'>
        {
          objectEntries(mailles)
            .filter(([maille]) => maillesInternesAccessiblesEnLecture.includes(maille))
            .map(([maille, libellé]) => (
              <button
                className={`fr-tag fr-mr-1w${mailleQuery === maille ? ' tag-selectionnee' : ''}`}
                key={maille}
                onClick={() => changerMaille(maille)}
                type='button'
              >
                <p className='titre-ellipsis fr-text--sm'>
                  {libellé}
                </p>

              </button>
            ))
        }
      </div>
    </SélecteurMailleStyled>
  );
};

export default SélecteurMaille;
