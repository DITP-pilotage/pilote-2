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
`;

export default MiseEnPageStyled;
