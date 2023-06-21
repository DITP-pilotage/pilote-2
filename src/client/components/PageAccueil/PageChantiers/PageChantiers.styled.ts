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
  
  .alertes {
    .titre-remontée-alertes {
      color: var(--text-default-warning);
    }
    
    .infobulle-bouton {
      color: var(--text-default-warning);
    }
  }

`;

export default PageChantiersStyled;
