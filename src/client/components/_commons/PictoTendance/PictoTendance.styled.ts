import styled from '@emotion/styled';

const PictoTendanceStyled = styled.span`
  &.picto-tendance--baisse {
    color: var(--background-flat-error);
    transform: rotate(90deg);
  }
  
  &.picto-tendance--stagnation {
    color: var(--background-flat-info);
  }
  
  &.picto-tendance--hausse {
    color: var(--background-flat-success);
  }
`;

export default PictoTendanceStyled;
