import { FunctionComponent, ReactNode } from 'react';
import EncartStyled from '@/components/_commons/Encart/Encart.styled';

interface EncartProps {
  children: ReactNode;
}

const Encart: FunctionComponent<EncartProps> = ({ children }) => {
  return (
    <EncartStyled className='encart-container'>
      { children }
    </EncartStyled>
  );
};

export default Encart;
