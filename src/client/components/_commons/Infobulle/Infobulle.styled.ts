import styled from "@emotion/styled";

const InfobulleStyled = styled.span`
  position: relative;
  display: inline-block;

  .tooltip-infobulle {
    z-index: 10000;
    max-width: 100%;
    color: var(--text-title-grey);
    background-color: var(--background-alt-blue-france);
    border-radius: 0.5rem;
    box-shadow: 0 4px 2px #0002;
  }

  .tooltip-accordeon {
    max-width: 50% !important;
  }
`;

export default InfobulleStyled;
