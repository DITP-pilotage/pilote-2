import styled from '@emotion/styled';
import { breakpointSm } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const TableauChantiersActionsDeTriStyled = styled.div`
  display: flex;
  align-items: end;
  width: 100%;
  max-width: 22rem;

  @media screen and (max-width: ${breakpointSm}) {
    max-width:100%;
  }

  .sélecteur-colonne-à-trier {
    flex-grow: 1;

    select {
      background-color: var(--background-alt-blue-france);
    }
  }
`;

export default TableauChantiersActionsDeTriStyled;
