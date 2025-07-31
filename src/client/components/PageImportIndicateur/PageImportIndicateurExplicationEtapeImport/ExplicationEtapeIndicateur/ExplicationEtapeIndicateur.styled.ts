import styled from "@emotion/styled";

const ExplicationEtapeIndicateurStyled = styled.div`
  height: 100%;
  background-color: #fff;
  border: 1px solid var(--border-default-grey);

  .explication-indicateur__numero {
    --diametre: 2rem;

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--diametre);
    height: var(--diametre);
    color: #fff;
    background-color: var(--background-action-high-blue-france);
    border-radius: var(--diametre);

    &::before,
    &::after {
      position: absolute;
      display: block;
      height: 0.5rem;
      content: "";
      background-color: var(--background-action-high-blue-france);
      border-radius: var(--diametre);
    }

    &::before {
      left: calc(var(--diametre) - 0.5rem);
      width: var(--diametre);
    }

    &::after {
      left: calc(var(--diametre) * 2);
      width: 0.5rem;
    }
  }

  &.etape-courante {
    border: 1px solid var(--text-title-blue-france);
  }
`;

export default ExplicationEtapeIndicateurStyled;
