import { useRouter } from 'next/router';
import Link from 'next/link';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { maillesAccessiblesEnLectureStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import SélecteurMailleStyled from './SélecteurMaille.styled';

export default function SélecteurMaille({ mailleSelectionnee }: { mailleSelectionnee: 'départementale' | 'régionale' }) {
  const maillesAccessiblesEnLecture = maillesAccessiblesEnLectureStore();
  const router = useRouter();

  const maillesInternesAccessiblesEnLecture = maillesAccessiblesEnLecture.filter((maille): maille is MailleInterne => maille !== 'nationale');

  const mailles: Record<MailleInterne, string> = {
    'départementale': 'Départements',
    'régionale': 'Régions',
  };

  if (maillesInternesAccessiblesEnLecture.length <= 1) {
    return null;
  }

  return (
    <SélecteurMailleStyled className='fr-p-1v'>
      {
        objectEntries(mailles)
          .filter(([maille]) => maillesInternesAccessiblesEnLecture.includes(maille))
          .map(([maille, libellé]) => (
            <Link
              className={`${mailleSelectionnee === maille && 'sélectionné fr-text--bold'}`}
              href={{
                pathname: '/accueil/chantier/[territoireCode]',
                query: {
                  ...router.query,
                  territoireCode: 'NAT-FR',
                  maille,
                },
              }}
              key={maille}
              type='button'
            >
              {libellé}
            </Link>
          ))
      }
    </SélecteurMailleStyled>
  );
}
