import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore  } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import SélecteurMailleStyled from './SélecteurMaille.styled';

export default function SélecteurMaille() {
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
