import styled from '@emotion/styled';

const PremièrePageImpressionRapportDétailléStyled = styled.div`
  display: none;
  page-break-after: always;

  @media print {
    display: block;
  }

  main {
    background: var(--grey-1000-50);
  }
  
  .fond-bleu-clair {
    background-color: var(--blue-france-975-75);
  }

  .fr-logo {
    font-size: .7875rem;
  }
  
  .filtres-actifs-conteneur {
    max-height: 20cm;
  }

  .filtres-actifs {
    columns: auto 2;
    column-gap: 2rem;
    column-fill: auto;
    list-style-type: none;
    
    & > li > span {
      font-size: 1.3rem;
      line-height: 1.75rem;
    }
   
    & > li > ul {
      padding-left: 1rem;
      margin-block-start: 0.25rem;
      margin-block-end: 0;
      margin-bottom: 1rem;
    }
    
    li {
      padding-bottom: 0;
    }
    
    ul {
      padding-left: 1.25rem;
      margin-block-start: 0;
      margin-block-end: 0.25rem;
    }
  }
`;

export default PremièrePageImpressionRapportDétailléStyled;
