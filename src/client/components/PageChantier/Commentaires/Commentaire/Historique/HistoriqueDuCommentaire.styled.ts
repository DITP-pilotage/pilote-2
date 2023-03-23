import styled from '@emotion/styled';

const HistoriqueDuCommentaireStyled = styled.dialog`
  .bouton-fermer-modale {
    align-items: center;
  }
  
  .commentaires-conteneur {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .commentaires {
      height: 100%;
      overflow-y: auto;
    }
  }
`;

export default HistoriqueDuCommentaireStyled;
