import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const FiltresActifsStyled = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--background-alt-blue-france);
  box-shadow: 0 6px 18px var(--shadow-color);

  .conteneur-tags {
    max-height: 7.5rem;
    padding-inline-start: 0;
    overflow-y: auto;
    list-style: none;

    >li {
      display: inline;
    }
  }
  
  @media screen and (max-width: ${breakpointL}) {
    top: 3.5rem;
    
    .conteneur-tags {
      overflow-x: auto;
      white-space: nowrap;
    }
  }

  .boutons {
    border: 1px solid #7b7b7b;
    border-radius: 0.375rem;
  }
`;

export default FiltresActifsStyled;
