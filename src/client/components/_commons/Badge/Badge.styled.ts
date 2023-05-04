import styled from '@emotion/styled';

const BadgeStyled = styled.p`
  &.badge-gris {
    color: var(--text-mention-grey);
    background-color: var(--background-contrast-grey);
  }
  
  &.badge-vert {
    color: var(--background-flat-success);
    background-color: var(--green-emeraude-975-75);
  }
  
  &.badge-bleu {
    color: var(--background-flat-info);
    background-color: var(--background-contrast-info);
  }
  
  &.badge-jaune {
    color: #695240;
    background-color: var(--green-tilleul-verveine-950-100);
  }
  
  &.badge-rouge {
    color: var(--background-flat-error);
    background-color: var(--background-contrast-warning);
  }
  
`;

export default BadgeStyled;
