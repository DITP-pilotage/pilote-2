import styled from '@emotion/styled';

const FicheIndicateurStyled = styled.div`
    h1, h2 {
      color: var(--text-title-blue-france);
    }
  
   .titre-input-metadata {
     margin: 0;

   }
  
   .infobulle {
     line-height: 0;
     
     .infobulle-texte {
       line-height: 1.5rem;
     }
   }

  .infobulle-bouton {
    min-height: 0;
    padding: 0;
    
    &::before {
      min-height: 0;
    }
  }

    .bouton-retour{
      &::before{
        margin-right: 0.625rem;

        --icon-size: 0.875rem;
      }

      color: var(--text-action-high-blue-france);
      background: none;
    }

    table {
      display: table;

      thead{
        background-color: var(--background-action-low-blue-france);
        border: 1px solid var(--border-disabled-grey);

        th:first-of-type{
          border-radius: 8px 0 0;
        }
      }

      td {
        max-width: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  
  .relative {
    position: relative;
  }
  `;

export default FicheIndicateurStyled;
