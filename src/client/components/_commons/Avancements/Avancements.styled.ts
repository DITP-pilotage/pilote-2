import styled from '@emotion/styled';
import { breakpointXL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const AvancementsStyled = styled.div`
  display: flex;
  row-gap: 1.5rem;
  column-gap: 2.5rem;
  justify-content: center;

  @media (width < 84rem) {
    column-gap: 1rem;
  }

  @media (width < ${breakpointXL}) {
    flex-basis: 100%;
    flex-wrap: wrap;
  }
  
  .jauges-statistiques {
    display: flex;
    column-gap: 1.5rem;
    
    @media (width > ${breakpointXL}) and (width < 84rem) {
      column-gap: 0.5rem;
    }
  }
`;

export default AvancementsStyled;
