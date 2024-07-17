import styled from '@emotion/styled';

const PageChantierEnTêteStyled = styled.header`
  background: var(--background-action-low-blue-france);
  
  .btn-retour {
    display: inline-block;
  }

  h1 {
    color: var(--text-title-blue-france);
  }

  .format-mobile {
    @media(max-width: 450px) {
      display : flex;
      flex-direction : column; 
    }

    &__bouton {
      @media(max-width: 450px) {
        display : flex;
        justify-content: center;
         width: 100%;
        margin-top: 16px;
      }
    }
      
    &__bouton-impression {
      @media(max-width: 450px) {
        width: 100%;
        margin-top: 16px;
      }
    }
  }
  
  @media print {
    margin-top: 1rem;
  }
`;

export default PageChantierEnTêteStyled;
