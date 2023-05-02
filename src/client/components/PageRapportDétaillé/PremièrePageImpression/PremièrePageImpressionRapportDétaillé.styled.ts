import styled from '@emotion/styled';

const PremièrePageImpressionRapportDétailléStyled = styled.div`
  display: none;
  page-break-after: always;

  .titre-rapport-détaillé, .sous-titre-rapport-détaillé {
    color: var(--background-action-high-blue-france);
    text-align: center;
  }

 @media print {
   display: block;

    @page {
      size: 1700px 2545px;
    }
    
    main {
      background: #FFF;

      .fr-container {
        max-width: 90em;
      }
    }
    
    .fr-header {
      display: block;
      filter: none;
    }

    .barre-latérale, .fr-btn, .fr-link {
      display: none;
    }

    /* .entête-rapport-détaillé {
      display: none;
    } */

    .date {
      position: absolute;
      bottom: 0;
    }
  }
  `;

export default PremièrePageImpressionRapportDétailléStyled;
