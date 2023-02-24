export const météos = ['NON_RENSEIGNEE', 'ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL', 'NON_NECESSAIRE'] as const;
export type Météo = typeof météos[number];
