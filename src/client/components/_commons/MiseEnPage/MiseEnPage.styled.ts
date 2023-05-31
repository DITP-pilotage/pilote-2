import styled from '@emotion/styled';

export const breakpointXL = '1248px';

const MiseEnPageStyled = styled.div`
  word-break: break-word;

  @media print {
    @page {
      margin: 1.5cm 1cm;
    }
    
    zoom: 125%;
    
    .fr-header, .fr-footer{
      display: none;
    }
    
    *::-webkit-scrollbar {
      display: none;
    }
    
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    
    main {
      background: none !important;
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
