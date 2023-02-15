type FormatDeDate = 'mm/yyyy';

const toLocaleDateStringOptions: Record<FormatDeDate, Intl.DateTimeFormatOptions> = {
  'mm/yyyy': { year: 'numeric', month: 'numeric' },
};

export function formaterDate(sqlDate: string | null | undefined, format: FormatDeDate) {
  if (!sqlDate)
    return null;

  if (Number.isNaN(Date.parse(sqlDate)))
    return null;

  const date = new Date(sqlDate);
  return date.toLocaleDateString('fr-FR', toLocaleDateStringOptions[format]);
}
