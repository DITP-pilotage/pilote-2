import { FunctionComponent } from 'react';
import TexteColoréStyled from '@/components/_commons/TexteColoré/TexteColoré.styled';
import { TexteColoréProps } from '@/components/_commons/TexteColoré/TexteColoré.interface';

const TexteColoré: FunctionComponent<TexteColoréProps> = ({ couleur, estGras, alignement = 'gauche', texte }) => {
  return (
    <TexteColoréStyled
      alignement={alignement}
      couleur={couleur}
      estGras={estGras}
    >
      {texte}
    </TexteColoréStyled>
  );
};

export default TexteColoré;
