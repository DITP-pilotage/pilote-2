import TexteColoréStyled from '@/components/_commons/TexteColoré/TexteColoré.styled';
import { TexteColoréProps } from '@/components/_commons/TexteColoré/TexteColoré.interface';

export default function TexteColoré({ couleur, estGras, alignement = 'gauche', texte }: TexteColoréProps) {
  return (
    <TexteColoréStyled
      alignement={alignement}
      couleur={couleur}
      estGras={estGras}
    >
      {texte}
    </TexteColoréStyled>
  );
}
