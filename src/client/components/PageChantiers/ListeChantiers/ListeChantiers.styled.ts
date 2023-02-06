import styled from '@emotion/styled';

const ListeChantiersStyled = styled.div`
  display: grid;
  color: var(--text-action-high-grey);

  th {
    &:nth-of-type(2) {
      width: 10rem;
      min-width: 10rem;
    }

    &:nth-of-type(3) {
      width: 15rem;
      min-width: 15rem;
    }
  }

  tbody {
    tr {
      height: 4.7rem;

      a {
        text-decoration: none;
        background: none;

        &:hover {
          font-weight: 700;
          color: var(--text-action-high-blue-france);
        }
      }
    }
  }
`;

export default ListeChantiersStyled;
