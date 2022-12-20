export type BarreDeProgressionTaille = 'petite' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: number | null,
  afficherLesCurseurs?: boolean,
}
