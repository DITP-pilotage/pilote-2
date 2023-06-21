import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type FormatDeDate = 'MM/YYYY' | 'DD/MM/YYYY';

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
