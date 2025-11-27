import styled from "@emotion/styled";

const BadgeStyled = styled.div`
  width: auto !important;
  font-size: 0.75rem;

  &.badge-gris {
    color: var(--text-mention-grey);
    background-color: var(--artwork-motif-grey);
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

  &.badge-noir {
    color: #ffffff;
    background-color: #000;
  }
`;

export default BadgeStyled;
