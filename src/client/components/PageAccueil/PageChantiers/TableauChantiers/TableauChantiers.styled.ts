import styled from "@emotion/styled";

const TableauChantiersStyled = styled.section<{
  chantiersArchives: boolean;
}>`
  color: var(--text-title-grey);

  table.tableau {
    display: table;

    tbody {
      tr {
        height: 4.5rem;

        td > a {
          display: flex;
          align-items: center;
          height: 100%;
          text-decoration: none;
          background: none;

          & > * {
            width: 100%;
          }
        }

        &.ligne-chantier {
          &:nth-of-type(even) {
            background-color: ${({ chantiersArchives }) =>
              chantiersArchives
                ? "var(--background-contrast-grey)"
                : "var(--background-contrast-blue-france)"};

            --hover: ${({ chantiersArchives }) =>
              chantiersArchives
                ? "var(--background-contrast-grey-hover)"
                : "var(--background-contrast-blue-france-hover)"};
          }

          &:nth-of-type(odd) {
            background-color: ${({ chantiersArchives }) =>
              chantiersArchives
                ? "var(--background-alt-grey)"
                : "var(--background-alt-blue-france)"};

            --hover: ${({ chantiersArchives }) =>
              chantiersArchives
                ? "var(--background-alt-grey-hover)"
                : "var(--background-alt-blue-france-hover)"};
          }

          &:hover {
            background-color: var(--hover);
          }
        }

        &.ligne-ministère,
        &.ligne-ministère:nth-of-type(2n) {
          cursor: pointer;
          background-color: var(--background-default-grey);
          background-image: linear-gradient(
            0deg,
            var(--border-default-grey),
            var(--border-default-grey)
          );
          background-repeat: no-repeat;
          background-position: bottom;
          background-size: 100% 1px;

          @media (hover: hover) {
            &:hover {
              background-color: var(--background-default-grey-hover);
            }
          }
        }
      }
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }
`;

export default TableauChantiersStyled;
