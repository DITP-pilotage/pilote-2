import styled from '@emotion/styled';

const BulleDInfoStyled = styled.div` 
  position: fixed;
  z-index: 1;
  min-width: 8rem;
  font-size: 0.75rem;
  vertical-align: middle;
  pointer-events: none; /* supprime le flickering lorsque le curseur est sur la bulle d'info */
  background-color: var(--background-contrast-grey);
  box-shadow: 0 4px 4px 0 #00000040;
  transform: translate(-50%, -6rem);

  div:last-child {
    background-color: var(--background-alt-grey);
  }

  @media screen and (max-width:450px) {
    width: 5rem;
  }
    
`;

export default BulleDInfoStyled;
