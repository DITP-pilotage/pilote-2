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

  .fr-select-group, .fr-select {
    width: 3.5rem;
    height: 1.5rem;
    padding: 0.07rem 0 0 0.2rem;
    margin: 0!important;
    font-size: 0.75rem!important;
    background-color: transparent;
    background-position: 100% 70%!important;
  }

  .fr-select {
    box-shadow: inset 0 -1px 0 0 var(--border-plain-grey)
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
