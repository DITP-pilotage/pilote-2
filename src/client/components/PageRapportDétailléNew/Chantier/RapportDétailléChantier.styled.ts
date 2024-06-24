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
      "avancement responsables"
      "synthèse   synthèse";
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
  
  .rubrique {
    break-inside: avoid;
    & .rubrique__conteneur > div {
      height: auto;
    }
  }
  
  .chantier-item {
    content-visibility: auto
  }
  
  @media print {
    .avancements,
    .cartes {
      break-inside: avoid;
    }
  }
`;

export default RapportDétailléChantierStyled;
