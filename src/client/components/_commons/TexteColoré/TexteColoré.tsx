import TexteColoréStyled from '@/components/_commons/TexteColoré/TexteColoré.styled';
import { TexteColoréProps } from '@/components/_commons/TexteColoré/TexteColoré.interface';

export default function TexteColoré({ couleur, estGras, texte }: TexteColoréProps) {
  return (
    <TexteColoréStyled
      couleur={couleur}
      estGras={estGras}
    >
      {texte}
    </TexteColoréStyled>
  );
}
