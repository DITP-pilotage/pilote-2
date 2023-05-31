import styled from '@emotion/styled';

const RapportDétailléChantierStyled = styled.section`
  .rubrique {
    display: flex;
    flex-direction: column;
  }

  @media print {
    .avancements,
    .cartes {
      break-inside: avoid;
    }
  }
`;

export default RapportDétailléChantierStyled;
