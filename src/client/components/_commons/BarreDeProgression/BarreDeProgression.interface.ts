export type BarreDeProgressionTaille = 'petite' | 'moyenne' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'gris';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: number | null,
  afficherTexte?: boolean,
}

export type BarreDeProgressionStyledProps = {
  variante: BarreDeProgressionVariante
  fond: BarreDeProgressionFond,
  taille: BarreDeProgressionTaille,
};
