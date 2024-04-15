import styled from '@emotion/styled';

const FiltresActifsStyled = styled.div`
  position: sticky;
  top: -1px;
  z-index: 2;
  background: var(--background-alt-blue-france);
  box-shadow: 0 6px 18px var(--shadow-color);

  .conteneur-tags {
    max-height: 7.5rem;
    overflow-y: auto;
    list-style: none;

    >li {
      display: inline;
    }
  }

  .boutons {
    border: 1px solid #7b7b7b;
    border-radius: 0.375rem;
  }
`;

export default FiltresActifsStyled;
