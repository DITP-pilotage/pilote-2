import styled from '@emotion/styled';

const ListeChantiersStyled = styled.div`
  display: grid;

  thead th {
    &:nth-of-type(2) {
      width: 9rem;
      min-width: 9rem;
    }

    &:nth-of-type(3) {
      width: 14rem;
      min-width: 14rem;
    }
  }
`;

export default ListeChantiersStyled;
