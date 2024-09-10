import styled from '@emotion/styled';

const ResponsablesLigneChantierStyled = styled.section`
    .bouton-format-mobile {
        @media(max-width: 450px) {
            align-items: flex-end;  
        }
          
        @media print {
            display: none;
        }
    }
`;

export default ResponsablesLigneChantierStyled;
