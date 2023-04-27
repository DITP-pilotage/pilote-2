import styled from '@emotion/styled';

const PageRapportDétailléStyled = styled.div`
  main {
    overflow-x: hidden;
  }
  
  h2 {
    color: var(--text-title-blue-france);
  }

  .entête-rapport-détaillé{
    display: flex;
  }
  
  .première-page-impression{
    display: none;
    page-break-after: always;
    
    
    .titre-rapport-détaillé, .sous-titre-rapport-détaillé{
      color: var(--background-action-high-blue-france);
      text-align: center;
    }
  }
  
  @media print{
    @page {
      size: 1700px 2545px;
    }
    
    main {
      background: #FFF;

      .fr-container{
        max-width: 90em;
      }
    }

    .barre-latérale, .fr-btn, .fr-link {
      display: none;
    }

    .première-page-impression{
      display: block;
      
      .fr-header{
        display: block;
        filter: none;
      }
    }

    .entête-rapport-détaillé{
      display: none;
    }
    
    section:not(:first-of-type) {
      break-inside: avoid;
    }
    
  }
`;

export default PageRapportDétailléStyled;
