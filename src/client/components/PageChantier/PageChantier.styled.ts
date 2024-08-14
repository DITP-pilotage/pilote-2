import styled from '@emotion/styled';
import { breakpointL } from '@/client/components/_commons/MiseEnPage/MiseEnPage.styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);
.btnss {

@media screen and (max-width: ${breakpointL}) {
  background-color: #f5f5fe; 
}}
  

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
        "avancement synthèse"
        "responsables   responsables";
      grid-template-columns: auto minmax(16.5rem, 1fr);
    }
  
    .layout--dept-reg {
      grid-template-areas:
        "avancement"
        "synthèse" 
        "responsables";
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

  .bouton-filtrer {
    position: sticky;
    top: 0;
    z-index: 999;
    width: 100%;
    background-color: #f5f5fe;
    box-shadow: 0 6px 18px var(--shadow-color);
  }
`;

export default PageChantierStyled;
