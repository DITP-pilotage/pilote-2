import { FunctionComponent, ReactNode } from 'react';
import BarreLatéraleEncartStyled from './BarreLatéraleEncart.styled';

interface BarreLatéraleEncartProps {
  children: ReactNode
}

const BarreLatéraleEncart: FunctionComponent<BarreLatéraleEncartProps> = ({ children }) => {
  return (
    <BarreLatéraleEncartStyled className='fr-p-3w fr-background-blue-france-925 w-full'>
      { children }
    </BarreLatéraleEncartStyled>
  );
};

export default BarreLatéraleEncart;
