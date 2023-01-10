import styled from '@emotion/styled';

const BulleDInfoStyled = styled.div`
  position: fixed;
  z-index: 1;
  font-size: 0.75rem;
  vertical-align: middle;
  pointer-events: none; /* supprime le flickering lorsque le curseur est sur la bulle d'info */
  background-color: var(--background-contrast-grey);
  box-shadow: 0 4px 4px 0 #00000040;
  transform: translate(-50%, -3rem);

  div:last-child {
    background-color: var(--background-alt-grey);
  }
`;

export default BulleDInfoStyled;
