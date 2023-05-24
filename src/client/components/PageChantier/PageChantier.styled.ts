import styled from '@emotion/styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  h2 {
    color: var(--text-title-blue-france);
  }

  tbody {
    background: none;
  }
  
  .texte-impression {
    display: none;
  }
  
  @media print {
    @page {
      size: 1800px 2545px;
    }
    
    .texte-impression {
      position: fixed;
      left: 50%;
      display: block;
      transform: translate(-50%, 0);
    }

    section {
      break-inside: avoid;
    }
    
    main {
      background: #FFF;
    }
    
    .barre-latérale, .fr-btn, .fr-link, .fr-accordion, #indicateurs section:not(:has(table)) {
      display: none;
    }
  }
`;

export default PageChantierStyled;
