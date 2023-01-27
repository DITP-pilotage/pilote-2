import styled from '@emotion/styled';

const ListeChantiersStyled = styled.div`

  display: grid;
  
  thead th {
    &:nth-of-type(1){
      min-width: 23.75rem;
      width: 23.75rem;
    },
    &:nth-of-type(2){
      min-width: 15rem;
      width: 15rem;
    },
    &:nth-of-type(3){
      min-width: 20rem;
      width: 20rem;
    },
  }
`;

export default ListeChantiersStyled;
