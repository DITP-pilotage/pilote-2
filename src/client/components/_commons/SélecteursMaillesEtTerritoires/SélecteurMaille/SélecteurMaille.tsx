import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore  } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import SélecteurMailleStyled from './SélecteurMaille.styled';
import SélecteurMailleProps from './SélecteurMaille.interface';

export default function SélecteurMaille({ habilitation }: SélecteurMailleProps) {

  const { modifierMailleSélectionnée } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const maillesÀAfficher: { label: string, valeur: MailleInterne }[] = [
    {
      label: 'Départements',
      valeur: 'départementale',
    },
    {
      label: 'Régions',
      valeur: 'régionale',
    },
  ];
  const maillesDisponibles = habilitation.recupererListeMailleEnLectureDisponible();

  if (maillesDisponibles.length  == 1) {
    const maille = maillesÀAfficher[(maillesDisponibles[0] == 'départementale') ? 0 : 1 ];
    return (
      <SélecteurMailleStyled className='fr-p-1v'>
        <button
          className={`${mailleSélectionnée === maille.valeur && 'sélectionné fr-text--bold'}`}
          key={maille.valeur}
          onClick={() => modifierMailleSélectionnée(maille.valeur)}
          type='button'
        >
          {maille.label}
        </button>
      </SélecteurMailleStyled>
    );
  }
  
  return (
    <SélecteurMailleStyled className='fr-p-1v'>
      {
        maillesÀAfficher.map(maille => (
          <button
            className={`${mailleSélectionnée === maille.valeur && 'sélectionné fr-text--bold'}`}
            key={maille.valeur}
            onClick={() => modifierMailleSélectionnée(maille.valeur)}
            type='button'
          >
            {maille.label}
          </button>
        ))
      }
    </SélecteurMailleStyled>
  );
}
