import styled from '@emotion/styled';

const IndicateursStyled = styled.section`
  .sous-rubrique-indicateur:last-of-type {
    margin-bottom: 0 !important;
  }
  
  @media print {
    .sous-rubrique-indicateur {
      break-inside: avoid;
    }
  }
`;

export default IndicateursStyled;
