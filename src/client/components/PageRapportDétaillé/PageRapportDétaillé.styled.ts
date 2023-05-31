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

  @media print {
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
