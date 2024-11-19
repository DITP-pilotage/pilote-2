import { useRouter } from 'next/router';
import { FunctionComponent } from 'react';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
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
    'régionale': 'Régions',
    'départementale': 'Départements',
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
    undefined,
    {},
    );
  };

  return (
    <SélecteurMailleStyled className='fr-p-1v'>
      <div className='flex tag-liste'>
        {
          objectEntries(mailles)
            .filter(([maille]) => maillesInternesAccessiblesEnLecture.includes(maille))
            .map(([maille, libellé]) => (
              <button
                className={`fr-tag fr-tag--sm fr-mr-1w${mailleQuery === maille ? ' tag-selectionnee' : ''}`}
                key={maille}
                onClick={() => changerMaille(maille)}
                type='button'
              >
                {libellé}
              </button>
            ))
        }
      </div>
    </SélecteurMailleStyled>
  );
};

export default SélecteurMaille;
