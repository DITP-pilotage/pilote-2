export type JaugeDeProgressionCouleur = 'bleu' | 'bleu-clair' | 'violet' | 'orange' | 'vert' | 'rose';
export type JaugeDeProgressionTaille = 'sm' | 'md' | 'lg';

export interface JaugeDeProgressionProps {
  couleur: JaugeDeProgressionCouleur,
  libellé: string,
  pourcentage: number | null,
  taille: JaugeDeProgressionTaille,
  noWrap?: boolean,
}
