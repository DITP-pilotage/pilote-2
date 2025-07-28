import styled from "@emotion/styled";

const RepartitionsMeteosChantiersStyled = styled.ul`
  list-style: none;

  .bouton-repartition-meteos {
    height: 100%;
    padding: 1rem 0.5rem;
    border: 1px solid #e3e3fd;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgb(0 0 18 / 16%);
  }

  button.est-active {
    border-color: var(--text-title-blue-france);
  }

  .nombre-de-chantiers {
    color: var(--text-title-blue-france);
  }

  .label {
    color: var(--text-action-high-grey);
  }

  @media screen and (max-width: 80rem) {
    .fr-col-3 {
      padding: 0.125rem;
    }

    .label {
      font-size: 0.75rem !important;
    }
  }
`;

export default RepartitionsMeteosChantiersStyled;
