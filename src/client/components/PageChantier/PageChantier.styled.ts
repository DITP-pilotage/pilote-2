import styled from '@emotion/styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  .grid-template {
    display: grid;
    grid-template-areas:
      "avancement"
      "responsables"
      "synthèse";
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .layout--nat {
      grid-template-areas:
        "avancement responsables"
        "synthèse   synthèse";
      grid-template-columns: auto minmax(22.5rem, 1fr);
    }
  
    .layout--dept-reg {
      grid-template-areas:
        "avancement   avancement"
        "responsables synthèse";
    }
  }

  #avancement {
    grid-area: avancement;
  }

  #responsables {
    grid-area: responsables;
  }

  #synthèse {
    grid-area: synthèse;
  }
  
  .rubrique {
    display: grid;
    grid-template-rows: auto 1fr;
  }

  h2 {
    color: var(--text-title-blue-france);
  }

  tbody {
    background: none;
  }
  
  .texte-impression {
    display: none;
  }
  
  .loader {
    height: 100vh;
  }
  
  @media print {
    @page {
      size: 280mm 396mm;
    }

    
    .texte-impression {
      display: block;
      width: 100%;
      text-align: center
    }
    
    .rubrique {
      display: block;
      break-inside: avoid;
    }

    .barre-latérale, .fr-btn, .fr-link, .fr-accordion {
      display: none;
    }
  }
`;

export default PageChantierStyled;
