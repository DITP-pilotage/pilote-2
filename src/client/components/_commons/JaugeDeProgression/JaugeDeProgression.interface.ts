type JaugeDeProgressionCouleur = 'bleu' | 'violet' | 'orange' | 'vert';
export type JaugeDeProgressionTaille = 'grande' | 'petite';

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
