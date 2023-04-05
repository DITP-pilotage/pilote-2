import styled from '@emotion/styled';

const SynthèseDesRésultatsFormulaireStyled = styled.form`
  .partie-basse {
    flex-wrap: wrap;
    row-gap: 2rem;
    
    .fr-select-group {
      padding-right: 1.5rem;
      margin-bottom: 0;
    }
    
    .météo-picto {
      width: 4.5rem;
      height: 100%;
    }
    
    .actions {
      flex-grow: 1;
      align-self: center;
      justify-content: end;
      height: min-content;
      
      .fr-btn {
        border-radius: 4px;
      }
    }
  }
`;

export default SynthèseDesRésultatsFormulaireStyled;
