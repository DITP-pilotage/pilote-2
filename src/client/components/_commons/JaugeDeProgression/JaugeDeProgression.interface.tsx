export type JaugeDeProgressionCouleur = 'bleu' | 'violet' | 'orange' | 'vert';
export type JaugeDeProgressionTaille = 'grande' | 'petite';

export interface JaugeDeProgressionProps {
  couleur: JaugeDeProgressionCouleur,
  libellé: string,
  pourcentage: number,
  taille: JaugeDeProgressionTaille,
}
