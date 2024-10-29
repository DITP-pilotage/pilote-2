import styled from '@emotion/styled';

const PictoTendanceStyled = styled.span<{
  estArchive?: boolean
}>`
  &.picto-tendance--baisse {
    color: ${({ estArchive }) => (estArchive ? 'var(--text-disabled-grey)' : 'var(--background-flat-error)')};
    transform: rotate(90deg);
  }
  
  &.picto-tendance--stagnation {
    color: ${({ estArchive }) => (estArchive ? 'var(--text-disabled-grey)' : 'var(--background-flat-info)')};
  }
  
  &.picto-tendance--hausse {
    color: ${({ estArchive }) => (estArchive ? 'var(--text-disabled-grey)' : 'var(--background-flat-info)')};
  }
`;

export default PictoTendanceStyled;
