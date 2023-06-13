import { wordingFr } from '@/client/utils/i18n/wordingFr';

const i18n: Record<Locale, typeof wordingFr> = {
  'fr': wordingFr,
};

type Locale = 'fr';

export const translate = (locale: Locale = 'fr') => {
  return i18n[locale];
};

export const wording = translate('fr');
