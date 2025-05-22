import styled from '@emotion/styled';

const FiltresSélectionMultipleStyled = styled.div`
  button {
    width: 100%;
    text-align: left;
  }

  ul {
    list-style-type: none;
  }

  .tuile {
    border-radius: 0.25rem;
  }

  .actif {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france);
  }

  .actif:hover {
    background-color: var(--background-active-blue-france-hover);
  }
`;

export default FiltresSélectionMultipleStyled;
