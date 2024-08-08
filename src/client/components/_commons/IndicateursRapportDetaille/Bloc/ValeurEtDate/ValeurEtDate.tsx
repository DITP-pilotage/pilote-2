import { FunctionComponent } from 'react';
import { formaterDate } from '@/client/utils/date/date';

interface ValeurEtDateProps {
  valeur: number | null, 
  date?: string | null,
  unité?: string | null,
}

const ValeurEtDate: FunctionComponent<ValeurEtDateProps> = ({ valeur, date, unité }) => {
  const dateFormatée = formaterDate(date, 'MM/YYYY');
  return (
    <>
      <p className='indicateur-valeur'>
        { valeur !== null && valeur !== undefined ? valeur?.toLocaleString() + (unité?.toLocaleLowerCase() === 'pourcentage' ? ' %' : '') : '' }
      </p>
      {
          !!dateFormatée && (
            <p className='indicateur-date-valeur texte-gris'>
              { `(${dateFormatée})` }
            </p>
          )
        }
    </>
  );
};

export default ValeurEtDate;
