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
    @page {
      margin: 12mm 0;
      size: 280mm 396mm;
    }
    
    margin: 12mm;
    
    main {
      padding: 0 !important;
    }

    .interrupteur-chantiers {
      display: none;
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

    .entête-rapport-détaillé {
      display: none;
    }
  }
`;

export default PageRapportDétailléStyled;
