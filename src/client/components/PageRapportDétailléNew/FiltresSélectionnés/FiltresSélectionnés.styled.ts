import styled from '@emotion/styled';

const FiltresSélectionnésStyled = styled.div`
  .filtres-sélectionnés__conteneur {
    columns: auto 4;
    column-gap: 2rem;
    padding-left: 0;
    font-size: 0.95rem;
  }

  .filtres-sélectionnés__titre {
    color: var(--text-title-grey);
  }
  
  .filtres-sélectionnés__conteneur > * {
    display: inline-block;
    width: 100%;
  }
  
  @media print {
    display: none;
  }
`;

export default FiltresSélectionnésStyled;
