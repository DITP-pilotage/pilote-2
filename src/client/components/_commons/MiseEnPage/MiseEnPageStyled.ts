import styled from '@emotion/styled';

const MiseEnPageStyled = styled.div`
  word-break: break-word;

  @media print {
     .fr-header, .fr-footer{
      display: none;
    }
  }
`;

export default MiseEnPageStyled;
