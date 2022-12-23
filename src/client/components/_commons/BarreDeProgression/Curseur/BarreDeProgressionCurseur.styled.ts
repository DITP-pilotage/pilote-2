import styled from '@emotion/styled';
import { BarreDeProgressionVariante } from './../BarreDeProgression.interface';

type BarreDeProgressionCurseurStyledProps = {
  variante: BarreDeProgressionVariante
};

const BarreDeProgressionCurseurStyled = styled.div<BarreDeProgressionCurseurStyledProps>`
  svg {
    position: absolute;
    flex-shrink: 0;
    width: 0.75rem;
    height: 0.75rem;
    fill: ${props => props.variante === 'primaire' ? 'var(--background-action-high-blue-france)' : 'var(--artwork-minor-blue-france)'};
    stroke: ${props => props.variante === 'primaire' ? 'var(--background-action-high-blue-france)' : 'var(--artwork-minor-blue-france)'};
    transform: translateX(0.375rem);
  }
`;

export default BarreDeProgressionCurseurStyled;
