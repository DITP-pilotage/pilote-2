import styled from '@emotion/styled';

const SynthèseDesRésultatsStyled = styled.section`
  .conteneur-météo {
    text-align: center;
  }

  .météo-picto {
    width: auto;
    height: 6rem;
  }

  .actions {
    display: flex;
    justify-content: end;
  }

  .bouton-modifier {
    border-radius: 4px
  }

  .conteneur {
    display: grid;
    grid-template-columns: auto 1fr;
  }
`;

export default SynthèseDesRésultatsStyled;
