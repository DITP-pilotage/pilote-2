import styled from '@emotion/styled';

const ListeChantiersStyled = styled.div`

  display: grid;
  
  thead th {
    &:nth-of-type(2){
      min-width: 9rem;
      width: 9rem;
    },
    &:nth-of-type(3){
      min-width: 14rem;
      width: 14rem;
    },
  }
`;

export default ListeChantiersStyled;
