type Taille = {
  mesure: number,
  unité: 'rem' | 'em' | 'px'
};

export default interface PictoBaromètreProps {
  taille: Taille,
  className?: string,
}

export interface PictoBaromètreStyledProps {
  taille: Taille,
}
