import styled from "@emotion/styled";

const PageAdminIndicateursStyled = styled.div`
  .bouton-creation-indicateur {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;

    @media (max-width: 576px) {
      justify-content: center;
    }
  }

  .tableau {
    background-color: white;
  }
`;

export default PageAdminIndicateursStyled;
