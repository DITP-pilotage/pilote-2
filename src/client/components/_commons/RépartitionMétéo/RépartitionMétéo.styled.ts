import styled from '@emotion/styled';

const RépartitionMétéoStyled = styled.ul`
  list-style: none;

  .fr-col-3 {
    padding: .5rem;
  }

  @media screen and (max-width: 80rem) {
    .fr-col-3 {
      padding: 0.125rem;
    }

    div {
      padding-left: .25rem;
      padding-right: .25rem
    }

    .label {
      font-size: .75rem !important;
    }
  }
`;

export default RépartitionMétéoStyled;
