import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, maillesAccessiblesEnLectureStore  } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import SélecteurMailleStyled from './SélecteurMaille.styled';

export default function SélecteurMaille() {
  const { modifierMailleSélectionnée } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const maillesAccessiblesEnLecture = maillesAccessiblesEnLectureStore();

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
            <button
              className={`${mailleSélectionnée === maille && 'sélectionné fr-text--bold'}`}
              key={maille}
              onClick={() => modifierMailleSélectionnée(maille)}
              type='button'
            >
              {libellé}
            </button>
          ))
      }
    </SélecteurMailleStyled>
  );
}
