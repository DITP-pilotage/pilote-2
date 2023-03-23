import styled from '@emotion/styled';

const HistoriqueDuCommentaireStyled = styled.div`
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

export default HistoriqueDuCommentaireStyled;
