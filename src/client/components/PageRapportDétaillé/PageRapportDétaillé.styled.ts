import styled from '@emotion/styled';

const PageRapportDétailléStyled = styled.div`
  main {
    padding-top: 2rem;
    padding-bottom: 2rem;
    overflow-x: hidden;
  }
  
  h2 {
    color: var(--text-title-blue-france);
  }

  .entête-rapport-détaillé {
    display: flex;
  }

  @media print {
    .force-break-page {
      height: 500px;
    }
      
    @page {
      margin: 12mm 0; /* marges pour configuration de l'imprimante */
      size: 280mm 396mm;
    }

    margin: 12mm;
    
    main {
      padding: 0;
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

    .entête-rapport-détaillé {
      display: none;
    }
  }
`;

export default PageRapportDétailléStyled;
