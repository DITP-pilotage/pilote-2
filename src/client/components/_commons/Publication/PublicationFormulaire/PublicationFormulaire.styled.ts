import styled from '@emotion/styled';

const PublicationFormulaireStyled = styled.form`
  .partie-basse {
    flex-wrap: wrap;
    row-gap: 2rem;
    
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

export default PublicationFormulaireStyled;
