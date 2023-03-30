import styled from '@emotion/styled';

const CommentaireStyled = styled.section`
  display: flex;
  flex-direction: column;

  form {
    display: flex;
    flex-direction: column;
  }

  .actions {
    display: flex;
    align-self: flex-end;
  }

  .bouton-modifier {
    border-radius: 4px
  }
`;

export default CommentaireStyled;
