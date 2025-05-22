import styled from '@emotion/styled';

export const FiltresSélectionUniqueStyled = styled.div`
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

  .fr-tag {
    width: auto;
    min-width: auto;
  }

  .fr-tag-active {
    color: white;
    background-color: var(--blue-france-sun-113-625);
  }
  
  .fr-tag-active:hover {
    color: white;
    cursor: not-allowed;
    background-color: var(--blue-france-sun-113-625);
  }
`;
