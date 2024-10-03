import styled from '@emotion/styled';

const RapportDétailléChantierStyled = styled.section`

  .grid-template {
    display: grid;
    grid-template-areas:
      "avancement"
      "responsables"
      "synthèse";
    gap: 1.5rem;
  }

  .layout--nat {
    grid-template-areas:
      "avancement avancement"
      "responsables responsables"
      "synthèse synthèse";
    grid-template-columns: auto minmax(22.5rem, 1fr);
  }

  .layout--dept-reg {
    grid-template-areas:
      "avancement"
      "responsables"
      "synthèse";
  }

  .rubrique.avancement {
    grid-area: avancement;
  }

  .rubrique.responsables {
    grid-area: responsables;
  }

  .rubrique.synthèse {
    grid-area: synthèse;
  }

  .chantier-item {
    content-visibility: auto;
    break-before: page;
  }
  
    .impression-sections {
      break-inside: avoid;
    }
  @media print {
    .impression-section {
      break-inside: avoid;
    }
  }
`;

export default RapportDétailléChantierStyled;
