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

    main {
      background: var(--grey-1000-50);

      .fr-container {
        max-width: 90em;
      }
    }

    .fr-header {
      display: block;
      filter: none;
    }

    .date {
      position: absolute;
      bottom: 0;
    }
  }
`;

export default PremièrePageImpressionRapportDétailléStyled;
