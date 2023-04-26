import { ReactNode } from 'react';
import EncartStyled from '@/components/PageRapportDétaillé/Encart/Encart.styled';

interface EncartProps {
  children: ReactNode;
}

export default function Encart({ children }: EncartProps) {
  return (
    <EncartStyled>
      { children }
    </EncartStyled>
  );
}
