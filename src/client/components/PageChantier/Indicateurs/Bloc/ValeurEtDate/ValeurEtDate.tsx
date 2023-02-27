import { formaterDate } from '@/client/utils/date/date';
import ValeurEtDateProps from './ValeuretDate.interface';

export default function ValeurEtDate({ valeur, date }: ValeurEtDateProps) {
  const dateFormatée = formaterDate(date, 'mm/yyyy');
  return (
    <>
      <p className='indicateur-valeur'>
        {valeur?.toLocaleString()}
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
