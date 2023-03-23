import styled from '@emotion/styled';

const HistoriqueDUnCommentaireStyled = styled.div`
  .bouton-ouvrir-modale {
    font-size: 0.875rem;
    line-height: 1.125rem;
    border-bottom: 1px solid;
  }
  
  .bouton-ouvrir-modale:hover {
    background-color: unset;
    border-bottom-width: 2px;
  }
  
  .bouton-fermer-modale {
    align-items: center;
  }
  
  .arrière-plan {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100vw;
    height: 100vh;
    cursor: pointer;
  }
  
  .commentaires-conteneur {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0.5rem;

    .commentaires {
      height: 100%;
      overflow-y: auto;
    }
  }
`;

export default HistoriqueDUnCommentaireStyled;
