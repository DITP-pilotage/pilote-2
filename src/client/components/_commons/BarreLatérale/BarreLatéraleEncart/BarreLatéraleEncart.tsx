import { ReactNode } from 'react';
import BarreLatéraleEncartStyled from './BarreLatéraleEncart.styled';

export default function BarreLatéraleEncart({ children }: { children: ReactNode }) {
  return (
    <BarreLatéraleEncartStyled>
      <div className='fr-p-3w'>
        { children }
      </div>
    </BarreLatéraleEncartStyled>
  );
}
