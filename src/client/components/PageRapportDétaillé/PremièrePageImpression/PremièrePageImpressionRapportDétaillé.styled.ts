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

  .filtres-actifs {
    font-size: 1.5rem;
    font-weight: bold;
    list-style-type: none;
   
    & > li > ul {
      margin-block-start: 0.5rem;
      margin-block-end: 0;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      line-height: 1.75rem;
    }
    
    li {
      padding-bottom: 0;
    }
    
    ul {
      padding-left: 1.5rem;
    }
  }

  .date {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
`;

export default PremièrePageImpressionRapportDétailléStyled;
