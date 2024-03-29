import styled from '@emotion/styled';

const SynthèseDesRésultatsHistoriqueStyled = styled.div`
  .conteneur-météo {
    text-align: center;
  }

  .météo-picto {
    width: auto;
    height: 5rem;
  }
  
  .conteneur {
    display: grid;
  }
  
  @media (min-width: 48rem) {
    .conteneur {
      grid-template-columns: 1fr 4fr;
      grid-column-gap: 1rem;
    }
  }
`;

export default SynthèseDesRésultatsHistoriqueStyled;
