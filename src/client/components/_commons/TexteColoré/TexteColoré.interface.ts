export interface TexteColoréProps {
  couleur: 'rouge' | 'bleu' | 'vert',
  estGras?: boolean,
  texte: string,
}

export interface TexteColoréStyledProps {
  couleur: TexteColoréProps['couleur'],
  estGras?: TexteColoréProps['estGras'],
}
