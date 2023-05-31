import styled from '@emotion/styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  .rubrique {
    display: flex;
    flex-direction: column;
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
      size: 1800px 2545px;
    }

    zoom: 125%;
    
    .texte-impression {
      position: fixed;
      display: block;
      width: 100%;
      text-align: right;
    }
    
    .rubrique {
      display: block;
      break-inside: avoid;
    }
    
    main {
      background: #FFF !important;
    }

    .barre-latérale, .fr-btn, .fr-link, .fr-accordion {
      display: none;
    }
  }
`;

export default PageChantierStyled;
