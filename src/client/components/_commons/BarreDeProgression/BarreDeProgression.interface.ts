export type BarreDeProgressionTaille = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'blanc' | 'grisMoyen' | 'grisClair';
export type BarreDeProgressionBordure = 'bleu' | 'grisMoyen' | null;
export type BarreDeProgressionPositionTexte = 'côté' | 'dessus';


export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  bordure?: BarreDeProgressionBordure,
  valeur: number | null,
  positionTexte? : BarreDeProgressionPositionTexte,
  afficherTexte?: boolean,
}

export type BarreDeProgressionStyledProps = {
  variante: BarreDeProgressionVariante
  fond: BarreDeProgressionFond,
  bordure: BarreDeProgressionBordure,
  positionTexte : BarreDeProgressionPositionTexte,
  taille: BarreDeProgressionTaille,
};
