import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const AvancementsStyled = styled.div`
  display: flex;
  gap: 1.5rem 2.5rem;
  justify-content: center;

  .fr-select-group, .fr-select {
    width: 3.5rem;
    height: 1.5rem;
    padding: 0.07rem 0 0 0.2rem;
    margin: 0!important;
    font-size: 0.75rem!important;
    background-color: transparent;
    background-position: 100% 70%!important;
  }

  .fr-select {
    box-shadow: inset 0 -1px 0 0 var(--border-plain-grey)  
  }

  @media (width < 84rem) {
    column-gap: 1rem;
  }

  @media (width < ${breakpointL}) {
    flex-basis: 100%;
    flex-wrap: wrap;
  }

  .jauges-statistiques {
    display: flex;
    column-gap: 1.5rem;

    @media (width > ${breakpointL}) and (width < 84rem) {
      column-gap: 0.5rem;
    }
  }
`;

export default AvancementsStyled;
