import styled from "@emotion/styled";

const RepartitionsMeteosRapportDetailleStyled = styled.ul`
  list-style: none;

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

export default RepartitionsMeteosRapportDetailleStyled;
