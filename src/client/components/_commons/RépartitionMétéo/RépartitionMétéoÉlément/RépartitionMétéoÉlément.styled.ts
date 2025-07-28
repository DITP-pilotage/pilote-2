import styled from "@emotion/styled";

interface RépartitionMétéosÉlémentStyledProps {
  estArchive?: boolean;
}

const RépartitionMétéoÉlémentStyled = styled.div<RépartitionMétéosÉlémentStyledProps>`
  height: 100%;
  padding: 1rem 0.5rem;
  border: 1px solid #e3e3fd;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgb(0 0 18 / 16%);

  .meteo-picto {
    width: auto;
    height: auto;
    filter: ${({ estArchive }) => (estArchive ? "grayscale(100%)" : undefined)};
  }

  .nombre-de-chantiers {
    color: ${({ estArchive }) =>
      estArchive
        ? "var(--text-disabled-grey)"
        : "var(--text-title-blue-france)"};
  }

  .label {
    color: var(--text-action-high-grey);

    @media print {
      font-size: smaller;
    }
  }
`;

export default RépartitionMétéoÉlémentStyled;
