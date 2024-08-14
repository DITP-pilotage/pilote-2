import styled from '@emotion/styled';
import { breakpointLg } from '@/client/components/_commons/MiseEnPage/MiseEnPage.styled';

const SynthèseDesRésultatsStyled = styled.div`
  .contenu {
    display: flex;
    flex-wrap: wrap;
    column-gap: 1rem;
    justify-content: center;
  }
  
  .météo-affichage {
    flex-basis: 8rem;
    text-align: center;
    
    p {
      font-size: 0.75rem;
      line-height: 1.25rem;
    }
  }
  
  .synthèse-affichage {
    flex-basis: 18rem;
    flex-grow: 1;
  }

  .météo-picto {
    width: 5rem;
    height: auto;
  }

  .boutons-meteo  {
    @media screen and (max-width: ${breakpointLg}) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
    }
  }
    
  .bouton-modifier {
    border-radius: 0.25rem;
    margin-left: 1rem;
    
      @media screen and (max-width: ${breakpointLg}) {
        justify-content: center;
        width: 100%;
        margin-top: 1rem;
      }
  }
`;

export default SynthèseDesRésultatsStyled;
