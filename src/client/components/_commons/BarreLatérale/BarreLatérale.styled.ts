import styled from '@emotion/styled';
import { breakpointL } from '@/components/_commons/MiseEnPage/MiseEnPage.styled';
import { BarreLatéraleStyledProps } from './BarreLatérale.interface';

const BarreLatéraleStyled = styled.div<BarreLatéraleStyledProps>`
  .barre-latérale {
    position: sticky;
    top: 0;
    z-index: 2;
    width: 20rem;
    height: 100vh;
    padding-bottom: 8rem;
    overflow-y: auto;
    background: white;
    border-right: 1px solid var(--border-disabled-grey);
  }

  @media screen and (max-width: ${breakpointL}) {
    .barre-latérale {
      position: fixed;
      left: 0;
      z-index: 10000;
      width: 100%;
      transition: 500ms;
      transform: ${props => props.estOuvert ? 'translateY(0)' : 'translateY(-200rem)'};
    }
  }

  .bouton-fermer{
    background-color: #ececfe;
  }

  .arrière-plan {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 501;
    width: 100vw;
    height: 100vh;
    cursor: pointer;
    background-color: #0003;
  }
`;

export default BarreLatéraleStyled;
