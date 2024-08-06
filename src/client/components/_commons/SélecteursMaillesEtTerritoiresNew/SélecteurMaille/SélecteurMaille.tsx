import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { maillesAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import SélecteurMailleStyled from './SélecteurMaille.styled';

export default function SélecteurMaille({ mailleSelectionnee, pathname }: {
  mailleSelectionnee: 'départementale' | 'régionale',
  pathname: string;
}) {
  const maillesAccessiblesEnLecture = maillesAccessiblesEnLectureStore();
  const router = useRouter();
  const { data: session } = useSession();

  const maillesInternesAccessiblesEnLecture = maillesAccessiblesEnLecture.filter((maille): maille is MailleInterne => maille !== 'nationale');

  const mailles: Record<MailleInterne, string> = {
    'départementale': 'Départements',
    'régionale': 'Régions',
  };

  if (maillesInternesAccessiblesEnLecture.length <= 1) {
    return null;
  }

  const territoireDept = session!.habilitations.lecture.territoires.find(territoire => territoire.startsWith('DEPT'));
  const territoireReg = session!.habilitations.lecture.territoires.find(territoire => territoire.startsWith('REG'));

  const changerMaille = (maille: MailleInterne) => {
    sauvegarderFiltres({ maille });
    const territoireCode = session?.habilitations.lecture.territoires.includes('NAT-FR') ? 'NAT-FR' : maille === 'régionale' ? territoireReg : maille === 'départementale' ? territoireDept : session?.habilitations.lecture.territoires[0];
    return router.push({
      pathname,
      query: { ...router.query, territoireCode, maille },
    },
    undefined,
    {},
    );
  };


  return (
    <SélecteurMailleStyled className='fr-p-1v'>
      {
        objectEntries(mailles)
          .filter(([maille]) => maillesInternesAccessiblesEnLecture.includes(maille))
          .map(([maille, libellé]) => (
            <button
              className={`${mailleSelectionnee === maille && 'sélectionné fr-text--bold'}`}
              key={maille}
              onClick={() => changerMaille(maille)}
              type='button'
            >
              {libellé}
            </button>
          ))
      }
    </SélecteurMailleStyled>
  );
}
