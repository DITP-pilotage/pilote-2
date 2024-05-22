import styled from '@emotion/styled';

const RapportDétailléTableauChantiersStyled = styled.section`
  overflow-x: auto;

  table.tableau {
    display: table;

    tbody {
      a {
        text-decoration: none;
        background: none;
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

  .icônes {
    color: var(--background-active-blue-france);
  }
`;

export default RapportDétailléTableauChantiersStyled;
