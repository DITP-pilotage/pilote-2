import styled from '@emotion/styled';

const IndicateurSpécificationsStyled = styled.div`
  position: relative;  
  background-color: var(--grey-975-125);
  
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
`;

export default IndicateurSpécificationsStyled;
