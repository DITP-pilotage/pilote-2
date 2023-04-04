type JaugeDeProgressionCouleur = 'bleu' | 'bleuClair' | 'violet' | 'orange' | 'vert';
export type JaugeDeProgressionTaille = 'sm' | 'lg';

export interface JaugeDeProgressionProps {
  couleur: JaugeDeProgressionCouleur,
  libellé: string,
  pourcentage: number | null,
  taille: JaugeDeProgressionTaille,
}

export interface JaugeDeProgressionStyledProps {
  taille: JaugeDeProgressionTaille,
  couleur: JaugeDeProgressionCouleur,
}
