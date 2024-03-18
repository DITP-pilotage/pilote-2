type JaugeDeProgressionCouleur = 'bleu' | 'bleuClair' | 'violet' | 'orange' | 'vert' | 'rose';
export type JaugeDeProgressionTaille = 'sm' | 'md' | 'lg';

export interface JaugeDeProgressionProps {
  couleur: JaugeDeProgressionCouleur,
  libellé: string,
  pourcentage: number | null,
  taille: JaugeDeProgressionTaille,
  noWrap?: boolean,
}

export interface JaugeDeProgressionStyledProps {
  taille: JaugeDeProgressionTaille,
  couleur: JaugeDeProgressionCouleur,
}
