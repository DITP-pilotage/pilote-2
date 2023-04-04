export const météosSaisissables = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;
export type MétéoSaisissable = typeof météosSaisissables;

export const météos = ['NON_RENSEIGNEE', ...météosSaisissables, 'NON_NECESSAIRE'] as const;
export type Météo = typeof météos[number];
