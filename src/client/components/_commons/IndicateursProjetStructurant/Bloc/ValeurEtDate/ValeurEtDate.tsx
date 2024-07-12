import { formaterDate } from '@/client/utils/date/date';
import ValeurEtDateProps from './ValeuretDate.interface';

export default function ValeurEtDate({ valeur, date, unité }: ValeurEtDateProps) {
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
}
