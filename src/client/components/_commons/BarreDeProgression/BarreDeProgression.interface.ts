export type BarreDeProgressionTaille = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
export type BarreDeProgressionVariante = 'primaire' | 'primaire-light' | 'secondaire' | 'rose';
export type BarreDeProgressionFond = 'bleu' | 'blanc' | 'gris-moyen' | 'gris-clair';
export type BarreDeProgressionBordure = 'bleu' | 'gris-moyen' | null;
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
