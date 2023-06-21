import styled from '@emotion/styled';
import { TexteColoréStyledProps } from '@/components/_commons/TexteColoré/TexteColoré.interface';

const codeHexaÀPartirDeLaCouleur = {
  'rouge': 'var(--background-flat-error)',
  'bleu': 'var(--background-flat-info)',
  'vert': 'var(--background-flat-success)',
};

const TexteColoréStyled = styled.span<TexteColoréStyledProps>`;
  font-weight: ${({ estGras }) => estGras ? 'bold' : 'normal'};
  color: ${({ couleur }) => codeHexaÀPartirDeLaCouleur[couleur]};
`;

export default TexteColoréStyled;
