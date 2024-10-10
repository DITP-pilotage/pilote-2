import styled from '@emotion/styled';

const IndicateurPoserUneQuestionStyled = styled.div`
  position: relative;  
  
  .icone-information{
    position: absolute;
    left: 3.25rem;
    color: var(--text-title-blue-france);
  }
  
  .sous-titre{
    display: inline-block;
    margin-bottom: 0.25rem;
    color: var(--text-title-blue-france);
  }
  
  p{
    margin-bottom: 0;
  }

  .bloc-question {
    background-color: var(--grey-975-125);
  }
`;

export default IndicateurPoserUneQuestionStyled;
