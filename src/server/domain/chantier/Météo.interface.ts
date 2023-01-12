type Météo = 1 | 2 | 3 | 4 | null;

export default Météo;

const VALEURS_MÉTÉO: Record<string, Météo> = {
  SOLEIL: 1,
  COUVERT: 2,
  NUAGE: 3,
  ORAGE: 4,
  NON_RENSEIGNEE: null,
  NON_NECESSAIRE: null, // TODO: différent de NON_RENSEIGNEE
};

export function météoFromString(label: string | null): Météo {
  if (!label) {
    return VALEURS_MÉTÉO.NON_RENSEIGNEE;
  }
  if (!Object.keys(VALEURS_MÉTÉO).includes(label)) {
    throw new Error(`Erreur: météo inconnue pour le label '${label}'`);
  }
  return VALEURS_MÉTÉO[label];
}
