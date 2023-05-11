export const météosSaisissables = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;
export type MétéoSaisissable = typeof météosSaisissables[number];

export const météos = ['NON_RENSEIGNEE', ...météosSaisissables, 'NON_NECESSAIRE'] as const;
export type Météo = typeof météos[number];

export const libellésMétéos: Record<Météo, string> = {
  'ORAGE': 'Objectifs compromis',
  'NUAGE': 'Appuis nécessaires',
  'COUVERT': 'Objectifs atteignables',
  'SOLEIL': 'Objectifs sécurisés',
  'NON_NECESSAIRE': 'Non nécessaire',
  'NON_RENSEIGNEE': 'Non renseignée',
};
