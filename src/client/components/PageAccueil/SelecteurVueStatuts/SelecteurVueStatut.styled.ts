import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const SelecteurVueStatutStyled = styled.div`
  display: flex;

  .conteneur-tags {
    display:flex;
  }
    
  @media screen and (max-width: ${breakpointL}) {   
    .conteneur-tags {
      overflow-x: scroll;
      white-space: nowrap;
    }
  }

  .fr-tag {
    min-width: auto;
  }
    
  .fr-tag-active {
    color: white;
    background-color: var(--blue-france-sun-113-625);
  }
  
  .fr-tag-active:hover {
    color: white;
    cursor: not-allowed;
    background-color: var(--blue-france-sun-113-625);
  }

  .separator {
    height: 100%;
    border-left: 2px solid var(--blue-france-sun-113-625);
  }
`;

export default SelecteurVueStatutStyled;
