import styled from "@emotion/styled";

const RépartitionMétéoStyled = styled.ul`
  list-style: none;

  .fr-col-3 {
    padding: 0.5rem;
  }

  @media screen and (max-width: 80rem) {
    .fr-col-3 {
      padding: 0.125rem;
    }

    div {
      padding-right: 0.25rem;
      padding-left: 0.25rem;
    }

    .label {
      font-size: 0.75rem !important;
    }
  }
`;

export default RépartitionMétéoStyled;
