import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type FormatDeDate = 'mm/aaaa' | 'jj/mm/aaaa';

const toLocaleDateStringOptions: Record<FormatDeDate, Intl.DateTimeFormatOptions> = {
  'mm/aaaa': { year: 'numeric', month: 'numeric' },
  'jj/mm/aaaa': { year: 'numeric', month: 'numeric', day: 'numeric' },
};

export function formaterDate(dateISO: string | null | undefined, format: FormatDeDate) {
  if (!dateISO)
    return null;

  if (Number.isNaN(Date.parse(dateISO)))
    return null;

  const date = new Date(dateISO);
  return date.toLocaleDateString('fr-FR', toLocaleDateStringOptions[format]);
}

export function horodatage() {
  return dayjs.tz(new Date, dayjs.tz.guess()).format('YYYY-MM-DD-HH-mm-ss');
}
