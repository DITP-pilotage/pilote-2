export const météos = ['NON_RENSEIGNEE', 'ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL', 'NON_NECESSAIRE'] as const;
type Météo = typeof météos[number];

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
