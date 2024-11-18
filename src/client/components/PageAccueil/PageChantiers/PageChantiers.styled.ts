import styled from '@emotion/styled';

const PageChantiersStyled = styled.main`
  .titre {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    
    .titre-liens {
      display: flex;
      flex-wrap: wrap;
    }
  }
  
  .fr-text--lg {
    line-height: 1.5rem;
  }

  .titre-gris {
    color: var(--text-disabled-grey);
  }
  
  .alertes {
    .titre-remontée-alertes {
      color: var(--text-default-warning);
    }
    
    .infobulle-bouton {
      color: var(--text-default-warning);
    }
  }

  .repartition-selecteur-maille .tag-liste {
    flex-direction: row;
    
    .fr-tag + .fr-tag {
      margin-top: 0;
    }
  }

  @media screen and (min-width: 78rem) and (max-width: 92rem) {
    .repartition-selecteur-maille {
      > div {
        width: 100%;
      }
    }

    .repartition-selecteur-maille .tag-liste {
      flex-direction: column;
      
      .fr-tag + .fr-tag {
        margin-top: 0.5rem;
      }
    }
  }

`;

export default PageChantiersStyled;
