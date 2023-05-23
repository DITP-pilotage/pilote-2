import styled from '@emotion/styled';

const TableauChantiersStyled = styled.section`
  display: grid;
  overflow-x: auto;
  color: var(--text-title-grey);
  
  .tableau-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 100%;

    .tableau-actions-gauche {
      display: flex;
      flex-wrap: wrap;
      column-gap: 2rem;
      align-items: center;

      & > * {
        flex-basis: content;
      }
      
      .barre-de-recherche {
        width: 100%;
        max-width: 22rem;
      }
    }

    .tableau-actions-droite {
      width: 100%;
      max-width: 22rem;
    }
  }

  table.tableau {
    display: table;

    tbody {
      tr {
        height: 4.5rem;
        
        td > a {
          display: flex;
          align-items: center;
          height: 100%;
          text-decoration: none;
          background: none;
          
          & > * {
            width: 100%;
          }
        }
        
        .météo-picto {
          height: 2rem;
        }

        &.ligne-chantier {
          &:hover:nth-of-type(even) {
            background-color: var(--background-contrast-grey-hover);
          }

          &:hover:nth-of-type(odd) {
            background-color: var(--background-alt-grey-hover);
          }
        }

        &.ligne-ministère,
        &.ligne-ministère:nth-of-type(2n) {
          cursor: pointer;
          background-color: var(--background-default-grey);
          background-image: linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey));
          background-repeat: no-repeat;
          background-position: bottom;
          background-size: 100% 1px;

          @media (hover: hover) {
            &:hover {
              background-color: var(--background-default-grey-hover);
            }
          }
        }
      }

      .chevron-accordéon::before {
        background-color: var(--blue-france-sun-113-625);
      }
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }

  .icônes {
    color: var(--background-active-blue-france)
  }
`;

export default TableauChantiersStyled;
