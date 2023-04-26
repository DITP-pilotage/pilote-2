import styled from '@emotion/styled';

const MiseEnPageStyled = styled.div`
  word-break: break-word;

  @media print {
    .fr-header, .fr-footer{
      display: none;
    }
  }
  
  main {
    flex-grow: 1;
    background: var(--background-alt-blue-france);

    h1 {
      color: var(--text-title-blue-france);
    }
  }

  @media print {
    @page {
      margin: 0;
    }
    
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    

    .non-imprimé,
    footer {
      display: none;
    }

    main {
      background: none;
    }
  }
`;

export default MiseEnPageStyled;
