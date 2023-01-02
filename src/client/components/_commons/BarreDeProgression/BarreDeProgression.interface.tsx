export type BarreDeProgressionTaille = 'petite' | 'moyenne' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: {
    minimum: number,
    médiane: number,
    moyenne: number,
    maximum: number
  } | number | null,
  afficherCurseurs?: boolean,
  afficherTexte?: boolean,
}
