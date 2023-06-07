import styled from '@emotion/styled';

const RépartitionMétéoStyled = styled.ul`
  list-style: none;

  .fr-col-3 {
    padding: .5rem;
  }

  @media screen and (max-width: 48rem) {
    .fr-col-3 {
      padding: .125rem;
    }

    div {
      padding: 1rem .25rem;
    }

    .label {
      font-size: .75rem !important;
    }
  }
`;

export default RépartitionMétéoStyled;
