import { ReactNode } from 'react';
import EncartStyled from '@/components/_commons/Encart/Encart.styled';

interface EncartProps {
  children: ReactNode;
}

export default function Encart({ children }: EncartProps) {
  return (
    <EncartStyled className='encart-container'>
      { children }
    </EncartStyled>
  );
}
