type FormatDeDate = 'mm/aaaa' | 'jj/mm/aaaa';

const toLocaleDateStringOptions: Record<FormatDeDate, Intl.DateTimeFormatOptions> = {
  'mm/aaaa': { year: 'numeric', month: 'numeric' },
  'jj/mm/aaaa': { year: 'numeric', month: 'numeric', day: 'numeric' },
};

export function formaterDate(sqlDate: string | null | undefined, format: FormatDeDate) {
  if (!sqlDate)
    return null;

  if (Number.isNaN(Date.parse(sqlDate)))
    return null;

  const date = new Date(sqlDate);
  return date.toLocaleDateString('fr-FR', toLocaleDateStringOptions[format]);
}
