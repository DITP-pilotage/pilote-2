import styled from '@emotion/styled';

const PageAdminIndicateursStyled = styled.div`
    .bouton-creation-indicateur {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;

        @media(max-width: 576px) {
            justify-content: center;
        }
    }
    .tableau {
        background-color: white;
    }
`;

export default PageAdminIndicateursStyled;
