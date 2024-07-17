import styled from '@emotion/styled';

const PageChantierEnTêteStyled = styled.header`
  background: var(--background-action-low-blue-france);
  
  .btn-retour {
    display: inline-block;
  }

  h1 {
    color: var(--text-title-blue-france);
  }

  .enTeteFormatMobile {
    @media(max-width: 450px) {
      display : flex;
      flex-direction : column; 
    }

    &__bouton {
      @media(max-width: 450px) {
        width: 100%;
        display : flex;
        justify-content: center;
        margin-top: 16px;
      }
    }
      
    &__boutonImpression {
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
