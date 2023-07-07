import styled from '@emotion/styled';

const PageRapportDétailléStyled = styled.div`
  main {
    overflow-x: hidden;
  }
  
  h2 {
    color: var(--text-title-blue-france);
  }

  .entête-rapport-détaillé {
    display: flex;
  }

  .texte-impression {
    display: none;
  }

  @media print {
    @page {
      margin: 12mm;
      size: 280mm 396mm;
    }

    .fr-container {
      width: 100%;
      max-width: none;
    }
    
    .texte-impression {
      display: block;
      width: 100%;
      text-align: center
    }

    table {
      overflow: hidden;
      
      td {
        background-color: var(--grey-1000-50);
      }
    }

    .chantiers section {
      break-inside: avoid;
    }

    .barre-latérale, .fr-btn, .fr-link {
      display: none;
    }

    .entête-rapport-détaillé {
      display: none;
    }
  }
`;

export default PageRapportDétailléStyled;
