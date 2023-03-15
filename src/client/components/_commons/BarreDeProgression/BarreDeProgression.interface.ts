export type BarreDeProgressionTaille = 'fine' | 'petite' | 'moyenne' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'blanc' | 'gris' | 'grisClair';
export type BarreDeProgressionBordure = 'bleu' | 'gris' | null;


export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  bordure?: BarreDeProgressionBordure,
  valeur: number | null,
  positionTexte? : 'côté' | 'dessus',
  afficherTexte?: boolean,
}

export type BarreDeProgressionStyledProps = {
  variante: BarreDeProgressionVariante
  fond: BarreDeProgressionFond,
  bordure: BarreDeProgressionBordure,
  positionTexte : 'côté' | 'dessus',
  taille: BarreDeProgressionTaille,
};
