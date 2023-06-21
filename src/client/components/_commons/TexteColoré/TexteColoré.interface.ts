type TexteColoréAlignement = 'gauche' | 'centre' | 'droite';

export interface TexteColoréProps {
  couleur: 'rouge' | 'bleu' | 'vert',
  estGras?: boolean,
  alignement?: TexteColoréAlignement,
  texte: string,
}

export interface TexteColoréStyledProps {
  couleur: TexteColoréProps['couleur'],
  estGras?: TexteColoréProps['estGras'],
  alignement: TexteColoréAlignement,
}
