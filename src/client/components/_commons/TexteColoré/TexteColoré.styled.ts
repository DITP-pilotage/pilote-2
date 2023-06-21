import styled from '@emotion/styled';
import { TexteColoréStyledProps } from '@/components/_commons/TexteColoré/TexteColoré.interface';

const couleurCSSÀPartirDeLaCouleur = {
  'rouge': 'var(--background-flat-error)',
  'bleu': 'var(--background-flat-info)',
  'vert': 'var(--background-flat-success)',
};

const TexteColoréStyled = styled.span<TexteColoréStyledProps>`;
  font-weight: ${({ estGras }) => estGras ? 'bold' : 'normal'};
  color: ${({ couleur }) => couleurCSSÀPartirDeLaCouleur[couleur]};
  text-align: ${({ alignement }) => alignement === 'droite' ? 'right' : (alignement === 'centre' ? 'centre' : 'gauche')};
`;

export default TexteColoréStyled;
