export type BarreDeProgressionTaille = 'petite' | 'moyenne' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: number | null,
  minimum?: number,
  médiane?: number,
  maximum?: number,
  afficherTexte?: boolean,
}
