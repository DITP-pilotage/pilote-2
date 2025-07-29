import styled from "@emotion/styled";

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  .grid-template {
    display: grid;
    grid-template-areas:
      "avancement"
      "synthèse"
      "responsables";
    gap: 0.7rem;
  }

  @media (min-width: 48rem) {
    .layout--nat {
      grid-template-areas:
        "avancement"
        "synthèse"
        "responsables";
      grid-template-columns: 1fr;
    }

    .layout--dept-reg {
      grid-template-areas:
        "avancement"
        "synthèse"
        "responsables";
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

    .titre-chantier-impression {
      display: block !important;
      margin-bottom: 1rem;
      page-break-after: avoid;
    }

    .horizontal-panel {
      display: none !important;
    }

    .layout--nat {
      grid-template-areas:
        "avancement synthèse"
        "responsables   responsables";
      grid-template-columns: auto minmax(22.5rem, 1fr);
    }

    .layout--dept-reg {
      grid-template-areas:
        "avancement"
        "synthèse"
        "responsables";
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

  .horizontal-panel {
    position: sticky;
    top: 0;
    z-index: 1;
    width: 100%;
    background-color: #f5f5fe;
    box-shadow: 0 6px 18px var(--shadow-color);
  }

  .fr-h2 {
    font-size: 1.875rem !important;
    line-height: 2.25rem !important;
  }

  .titre-chantier-impression {
    display: none;
  }
`;

export default PageChantierStyled;
