export const météos = ['NON_RENSEIGNEE', 'ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL', 'NON_NECESSAIRE'] as const;
type Météo = typeof météos[number];

export const libellésMétéos = {
  'ORAGE': 'Objectifs compromis',
  'NUAGE': 'Appuis nécessaires',
  'COUVERT': 'Objectifs atteignables',
  'SOLEIL': 'Objectifs sécurisés',
  'NON_NECESSAIRE': 'Non nécessaire',
  'NON_RENSEIGNEE': 'Non renseigné',
};

export function météoFromString(label: string | null): Météo {
  if (!label) {
    return 'NON_RENSEIGNEE';
  }
  const listeMétéos = [...météos] as string[];
  if (!listeMétéos.includes(label)) {
    throw new Error(`Erreur: météo inconnue pour le label '${label}'`);
  }
  return label as Météo;
}

export default Météo;
