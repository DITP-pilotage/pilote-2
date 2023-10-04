import styled from '@emotion/styled';

export const breakpointL = '992px';

const MiseEnPageStyled = styled.div`
  word-break: break-word;

  @media print {
    @page {
      margin: 1.5cm 1cm;
    }
    
    .barre-latérale, .fr-btn, .fr-link, .fr-header, .fr-footer {
      display: none !important;
    }
    
    *::-webkit-scrollbar {
      display: none;
    }
    
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    
    main {
      background: #fff !important;
    }
  }
  
  main {
    flex-grow: 1;
    background: var(--background-alt-blue-france);

    h1 {
      color: var(--text-title-blue-france);
    }
  }
`;

export default MiseEnPageStyled;
