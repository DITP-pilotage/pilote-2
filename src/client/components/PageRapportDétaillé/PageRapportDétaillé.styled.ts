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
    overflow: hidden;
    
    section:not(:first-of-type) {
      break-inside: avoid;
    }

    #cartes { 
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
