import styled from "@emotion/styled";

const IndexStyled = styled.div`
  .horizontal-panel {
    position: sticky;
    top: 0;
    z-index: 1;
    width: 100%;
    background-color: #f5f5fe;
    box-shadow: 0 6px 18px var(--shadow-color);
  }

  .lien-menu {
    background-image: none;
  }

  .fr-h2 {
    font-size: 1.875rem !important;
    line-height: 2.25rem !important;
  }
`;

export default IndexStyled;
