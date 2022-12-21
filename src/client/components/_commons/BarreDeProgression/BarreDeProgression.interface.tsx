export type BarreDeProgressionTaille = 'petite' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: {
    minimum: number,
    médiane: number,
    moyenne: number,
    maximum: number
  } | null,
  afficherLesCurseurs?: boolean,
}
