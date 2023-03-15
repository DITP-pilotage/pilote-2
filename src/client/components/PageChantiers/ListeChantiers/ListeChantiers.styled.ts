import styled from '@emotion/styled';

const ListeChantiersStyled = styled.div`
  display: grid;
  color: var(--text-action-high-grey);

  th {
    &:nth-of-type(3) {
      width: 11rem;
      min-width: 11rem;
    }

    &:nth-of-type(4) {
      width: 15rem;
      min-width: 15rem;
    }

    &:last-of-type {
      width: 4rem;
    }
  }

  tbody {
    tr {
      height: 4.7rem;

      a {
        text-decoration: none;
        background: none;

        &:hover {
          color: var(--text-action-high-blue-france);
        }
      }
    }

    .icone {
      color: var(--blue-france-sun-113-625)
    }
  }
`;

export default ListeChantiersStyled;
