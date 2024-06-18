import styled from '@emotion/styled';

const PageChantierEnTêteStyled = styled.header`
  background: var(--background-action-low-blue-france);
  
  .btn-retour {
    display: inline-block;
  }

  h1 {
    color: var(--text-title-blue-france);
  }

  .section-responsables-chantiers {
    color: var(--text-title-blue-france);
  }
  
  @media print {
    margin-top: 1rem;
  }
`;

export default PageChantierEnTêteStyled;
