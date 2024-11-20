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
    .fr-tag {
      display: block;
      min-width: 5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: normal;
    }
  }

`;

export default PageChantiersStyled;
