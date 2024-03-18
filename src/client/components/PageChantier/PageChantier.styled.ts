import styled from '@emotion/styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  .grid-template {
    display: grid;
    grid-template-areas:
      "avancement"
      "responsables"
      "synthèse";
    gap: 0.7rem;
  }

  @media (min-width: 48rem) {
    .layout--nat {
      grid-template-areas:
        "avancement responsables"
        "synthèse   synthèse";
      grid-template-columns: auto minmax(16.5rem, 1fr);
    }
  
    .layout--dept-reg {
      grid-template-areas:
        "avancement   avancement"
        "responsables synthèse";
    }
  }  
  
  @media (min-width: 78rem) {
    .layout--nat {
      grid-template-columns: auto minmax(22.5rem, 1fr);
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
  
  .loader {
    height: 100vh;
  }
  
  @media print {
    @page {
      margin: 12mm 0;
      size: 280mm 396mm;
    }
    
    background: #fff;
    
    main {
      margin-right: 12mm;
      margin-left: 12mm;
    }
    
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

    #avancement,
    #responsables,
    #cartes {
      break-inside: avoid;
    }

    .rubrique {
      display: block; /* pour que break-inside fasse effet */
    }

    .fr-accordion {
      display: none;
    }
  }
`;

export default PageChantierStyled;
