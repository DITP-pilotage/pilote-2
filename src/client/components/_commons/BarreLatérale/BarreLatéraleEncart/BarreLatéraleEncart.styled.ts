import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const BarreLatéraleEncartStyled = styled.div`
  width: 100%;
  background-color: var(--blue-france-850-200);
  
    @media screen and (max-width: ${breakpointL}) {
      background-color: #ececfe;
    }

  select {
    background-color: var(--background-alt-blue-france);
  }
`;

export default BarreLatéraleEncartStyled;
