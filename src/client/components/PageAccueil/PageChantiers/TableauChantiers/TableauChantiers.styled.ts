import styled from '@emotion/styled';
import { breakpointL, breakpointSm } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

const TableauChantiersStyled = styled.section`
  color: var(--text-title-grey);

  .tableau-actions-gauche {
    @media screen and (max-width: ${breakpointL}) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
      margin-top:1rem;
    }
  }

  .barre-de-recherche {
    width: 100%;
    max-width: 22rem;

      @media screen and (max-width: ${breakpointSm}) {
        max-width: 100%;
      }
  }
      
  .tableau-actions-droite {
    width: 100%;
    max-width: 22rem;

      @media screen and (max-width: ${breakpointSm}) {
        max-width:100%;
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
