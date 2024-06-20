import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SortingState } from '@tanstack/react-table';

dayjs.extend(utc);
dayjs.extend(timezone);

type FormatDeDate = 'MM/YYYY' | 'MM/YY' | 'DD/MM/YYYY' | 'DD/MM/YYYY [à] H[h]mm';

export function formaterDate(dateISO: string | null | undefined, format: FormatDeDate) {
  if (!dateISO)
    return null;

  if (Number.isNaN(Date.parse(dateISO)))
    return null;

  return dayjs.tz(new Date(dateISO), dayjs.tz.guess()).format(format);
}

export function horodatage() {
  return dayjs.tz(new Date, dayjs.tz.guess()).format('YYYY-MM-DD-HH-mm-ss');
}

export const comparerDateDeMàjDonnées = (a: string | null, b: string | null, tri: SortingState | null) => {
  const sensDeTriDesc = tri === null ? true : tri[0].desc;
  if (a === null && b === null)
    return 0;
  if (a === null)
    return sensDeTriDesc ? -1 : 1;
  if (b === null)
    return sensDeTriDesc ? 1 : -1;
  if (a < b)
    return -1;
  if (a > b)
    return 1;
  return 0;
};
