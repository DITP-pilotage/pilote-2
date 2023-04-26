import styled from '@emotion/styled';

const RapportDétailléTableauChantiersStyled = styled.section`
  display: grid;
  overflow-x: auto;
  color: var(--text-title-grey);

  table.tableau {
    display: table;

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
        }
      }

      .ligne-chantier {
        cursor: pointer;
        
        &:hover:nth-of-type(even) {
          background-color: var(--background-contrast-grey-hover);
        }
        
        &:hover:nth-of-type(odd) {
          background-color: var(--background-alt-grey-hover);
        }
      }
    }
  }

  .icône {
      color: var(--blue-france-sun-113-625)
    }
`;

export default RapportDétailléTableauChantiersStyled;
