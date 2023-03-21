import styled from '@emotion/styled';

const CommentaireStyled = styled.section`
    .contenu {
        display: flex;
        flex-direction: column;

        .boutons {
            align-self: flex-end;
            display: flex;
        }
    }

    button {
        border-radius: 4px;
    }
`;

export default CommentaireStyled;
