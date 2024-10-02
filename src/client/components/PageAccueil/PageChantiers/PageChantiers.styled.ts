import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';

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

  .taux-avancement-section{
    @media screen and (min-width: ${breakpointL}) {
        padding-right: 0.9rem;
      }
  }

`;

export default PageChantiersStyled;
