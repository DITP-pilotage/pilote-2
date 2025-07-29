import styled from "@emotion/styled";

const SectionTableauIndicateurStyled = styled.section`
  .fr-table {
    tbody > tr {
      td {
        max-width: 10rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
`;

export default SectionTableauIndicateurStyled;
