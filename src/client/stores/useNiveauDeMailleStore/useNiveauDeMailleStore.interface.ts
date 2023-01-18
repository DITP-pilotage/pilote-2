export type NiveauDeMaille = 'régionale' | 'départementale';

export default interface NiveauDeMailleStore {
  niveauDeMaille: NiveauDeMaille
  setNiveauDeMaille: (niveauDeMaille: NiveauDeMaille) => void
}
