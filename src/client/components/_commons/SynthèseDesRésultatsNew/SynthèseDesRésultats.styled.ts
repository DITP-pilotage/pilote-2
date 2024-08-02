import styled from '@emotion/styled';

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

  .actions {
    display: flex;
    justify-content: end;
  }

  .bouton-modifier {
    border-radius: 0.25rem;
  }
`;

export default SynthèseDesRésultatsStyled;
