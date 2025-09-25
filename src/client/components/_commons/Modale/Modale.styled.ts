import styled from "@emotion/styled";

const ModaleStyled = styled.div`
  color: initial !important;

  .modale-conteneur {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0.5rem;

    .modale-contenu {
      height: 100%;
      overflow-y: auto;
    }
  }
`;

export default ModaleStyled;
