import styled from '@emotion/styled';

const TableauProjetsStructurantsStyled = styled.section`
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

  .tableau-conteneur {
    overflow-x: auto;

    table.tableau {
      @media (max-width: 100em) {
        white-space: nowrap;
      }

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
        }
      }
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }

  .icônes {
      color: var(--blue-france-sun-113-625)
    }
`;

export default TableauProjetsStructurantsStyled;
