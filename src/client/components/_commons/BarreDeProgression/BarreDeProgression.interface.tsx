export type BarreDeProgressionTaille = 'petite' | 'moyenne' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: number | null,
  minimum?: number | null,
  médiane?: number | null,
  maximum?: number | null,
  afficherTexte?: boolean,
}
